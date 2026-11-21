// Emberwick — the lantern-warden. A guard patrols its waypoints, watches a
// vision cone, grows suspicious when the keeper is seen, gives chase on a
// full alarm, and walks over to investigate noises (a thrown pebble, or
// running feet). Suspicion decays when the keeper stays out of sight, so a
// near miss can still be recovered from.

import { GUARD, STEP } from './config.js';
import { hasLineOfSight, insideHedge, insideShadow, resolveCircleWalls } from './level.js';

export const GUARD_STATE = {
  PATROL: 'patrol',
  SUSPICIOUS: 'suspicious',
  CHASE: 'chase',
  INVESTIGATE: 'investigate',
  RETURN: 'return',
};

function angleTo(from, to) {
  return Math.atan2(to.y - from.y, to.x - from.x);
}

function angleDifference(a, b) {
  let diff = a - b;
  while (diff > Math.PI) diff -= Math.PI * 2;
  while (diff < -Math.PI) diff += Math.PI * 2;
  return diff;
}

export class Guard {
  constructor(spawn) {
    this.waypoints = spawn.waypoints;
    this.pauseSeconds = spawn.pause;
    this.x = spawn.waypoints[0].x;
    this.y = spawn.waypoints[0].y;
    this.waypointIndex = 1 % spawn.waypoints.length;
    this.pauseLeft = 0;
    this.facing = angleTo(this, this.waypoints[this.waypointIndex]);
    this.state = GUARD_STATE.PATROL;
    this.suspicion = 0;
    this.alarmLeft = 0;
    this.investigatePoint = null;
    this.investigateLeft = 0;
    this.lastSeen = null;
    this.stepPhase = Math.random() * Math.PI * 2;
  }

  canSeePlayer(player, level) {
    const dx = player.x - this.x;
    const dy = player.y - this.y;
    const distance = Math.hypot(dx, dy);
    if (distance > GUARD.visionRange) return { seen: false, distance };
    const toPlayer = Math.atan2(dy, dx);
    if (Math.abs(angleDifference(toPlayer, this.facing)) > GUARD.visionHalfAngle) {
      return { seen: false, distance };
    }
    if (!hasLineOfSight(this.x, this.y, player.x, player.y, level)) {
      return { seen: false, distance };
    }
    // A keeper crouched inside a hedge is invisible unless the guard is close.
    if (insideHedge(player.x, player.y, level) && distance > GUARD.hiddenSpotDistance) {
      return { seen: false, distance };
    }
    return { seen: true, distance };
  }

  hearNoise(point, radius) {
    if (this.state === GUARD_STATE.CHASE) return;
    const distance = Math.hypot(point.x - this.x, point.y - this.y);
    if (distance > radius + 40) return;
    this.investigatePoint = { ...point };
    this.investigateLeft = 3;
    this.state = GUARD_STATE.INVESTIGATE;
  }

  moveToward(target, speed, level) {
    const dx = target.x - this.x;
    const dy = target.y - this.y;
    const distance = Math.hypot(dx, dy);
    if (distance < 1) return true;
    const step = Math.min(distance, speed * STEP);
    const next = resolveCircleWalls(
      { x: this.x + (dx / distance) * step, y: this.y + (dy / distance) * step },
      GUARD.radius,
      level.walls,
    );
    this.x = next.x;
    this.y = next.y;
    this.facing = angleTo(this, target);
    return distance <= step + 1;
  }

  update(player, level, events) {
    const sight = this.canSeePlayer(player, level);
    const hidden = insideHedge(player.x, player.y, level);
    const shadowed = insideShadow(player.x, player.y, level);

    if (sight.seen) {
      let gain = sight.distance < 85 ? GUARD.suspicionGainClose : GUARD.suspicionGainFar;
      if (player.running) gain *= GUARD.suspicionRunMultiplier;
      if (shadowed) gain *= GUARD.suspicionShadowMultiplier;
      const before = this.suspicion;
      this.suspicion = Math.min(100, this.suspicion + gain * STEP);
      this.lastSeen = { x: player.x, y: player.y };
      if (before < 55 && this.suspicion >= 55) events.push({ type: 'spotted' });
      if (this.suspicion >= 100 && this.state !== GUARD_STATE.CHASE) {
        this.state = GUARD_STATE.CHASE;
        this.alarmLeft = GUARD.alarmSeconds;
        events.push({ type: 'alarm' });
      }
    } else {
      this.suspicion = Math.max(0, this.suspicion - GUARD.suspicionDecay * STEP);
    }

    if (this.state === GUARD_STATE.CHASE) {
      this.alarmLeft -= STEP;
      const target = this.lastSeen || { x: player.x, y: player.y };
      this.moveToward(target, GUARD.chaseSpeed, level);
      if (sight.seen) this.alarmLeft = GUARD.alarmSeconds;
      if (this.alarmLeft <= 0 || this.suspicion <= 15) {
        this.state = GUARD_STATE.RETURN;
        this.suspicion = Math.min(this.suspicion, 40);
      }
      return;
    }

    if (this.state === GUARD_STATE.INVESTIGATE) {
      this.investigateLeft -= STEP;
      const arrived = this.moveToward(this.investigatePoint, GUARD.investigateSpeed, level);
      if (arrived || this.investigateLeft <= 0) {
        this.state = GUARD_STATE.RETURN;
      }
      return;
    }

    if (this.state === GUARD_STATE.RETURN) {
      // Walk back to the nearest waypoint, then resume the patrol.
      let nearest = this.waypoints[0];
      let nearestDistance = Infinity;
      for (const point of this.waypoints) {
        const d = Math.hypot(point.x - this.x, point.y - this.y);
        if (d < nearestDistance) {
          nearestDistance = d;
          nearest = point;
        }
      }
      const arrived = this.moveToward(nearest, GUARD.patrolSpeed, level);
      if (arrived) {
        this.waypointIndex = this.waypoints.indexOf(nearest);
        this.state = GUARD_STATE.PATROL;
        this.pauseLeft = this.pauseSeconds;
      }
      return;
    }

    // PATROL (and SUSPICIOUS, which patrols while watching): walk the route,
    // pausing at each waypoint to look around.
    if (this.suspicion >= 55) this.state = GUARD_STATE.SUSPICIOUS;
    else if (this.state === GUARD_STATE.SUSPICIOUS) this.state = GUARD_STATE.PATROL;

    if (this.pauseLeft > 0) {
      this.pauseLeft -= STEP;
      // Look around slowly while paused (deterministic: driven by the sim clock).
      this.lookClock = (this.lookClock || 0) + STEP;
      this.facing += Math.sin(this.lookClock * 1.1 + this.stepPhase) * 0.004;
      return;
    }
    const target = this.waypoints[this.waypointIndex];
    const arrived = this.moveToward(target, GUARD.patrolSpeed, level);
    if (arrived) {
      this.waypointIndex = (this.waypointIndex + 1) % this.waypoints.length;
      this.pauseLeft = this.pauseSeconds;
    }
  }
}
