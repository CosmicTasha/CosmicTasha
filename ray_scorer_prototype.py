"""
CosmicTasha Ray Tracing Readiness Scorer — Prototype
=====================================================

Replaces the static weighted-average readiness score with a ray tracing model
that captures how compliance dimensions interact causally through claims.

Current model:  5 dimensions × static weights → weighted average → 0-100
Ray model:      claims emit rays → rays bounce through dimensions → path geometry
                reveals interaction effects → Monte Carlo sampling → 0-100 with
                confidence intervals and structural insight

The five readiness dimensions:
  1. Access Control Maturity (25%)
  2. Data Protection (20%)
  3. Operational Readiness (20%)
  4. Change Management (15%)
  5. Documentation Completeness (20%)

Key causal relationships this model captures:
  - Access Control ↔ Data Protection (access gaps cause data exposure)
  - Operational Readiness → Change Management (no monitoring = blind deploys)
  - Documentation → ALL (documentation gaps mask real state of every dimension)
  - Change Management → Operational Readiness (bad changes cause incidents)
"""

from dataclasses import dataclass, field
from enum import Enum
from typing import Optional
import random
import math


# ---------------------------------------------------------------------------
# Core data structures
# ---------------------------------------------------------------------------

class Dimension(Enum):
    """The five compliance dimensions from the CosmicTasha intake."""
    ACCESS_CONTROL = "access_control"
    DATA_PROTECTION = "data_protection"
    OPERATIONAL_READINESS = "operational_readiness"
    CHANGE_MANAGEMENT = "change_management"
    DOCUMENTATION = "documentation"


@dataclass
class DimensionState:
    """
    The current scored state of a single dimension, derived from intake answers.
    This is the INPUT to the ray tracer — the raw independent scores that the
    current weighted-average model already computes.
    """
    dimension: Dimension
    raw_score: float          # 0.0 - 1.0, from intake answers
    evidence_count: int       # how many intake answers contributed
    confidence: float         # 0.0 - 1.0, based on completeness of answers
    gaps: list[str] = field(default_factory=list)      # identified gap labels
    strengths: list[str] = field(default_factory=list)  # identified strengths


@dataclass
class Surface:
    """
    A dimension boundary that rays interact with. The surface properties
    determine how rays bounce (reflect), pass through (transmit), or
    get absorbed (terminate).

    Think of each dimension as a semi-transparent surface. A ray hitting
    "Access Control" either:
      - Reflects (the dimension reinforces the claim — score stays/improves)
      - Transmits (passes through to the next dimension — neutral)
      - Absorbs (the dimension contradicts the claim — energy lost)

    The mix depends on the dimension's raw_score.
    """
    dimension: Dimension
    reflectivity: float    # 0-1: how much energy bounces back (strength signal)
    transmissivity: float  # 0-1: how much passes through (neutral)
    absorptivity: float    # 0-1: how much is lost (gap signal)
    # reflectivity + transmissivity + absorptivity = 1.0

    @classmethod
    def from_dimension_state(
        cls,
        state: DimensionState,
        params: Optional[dict[str, float]] = None,
    ) -> "Surface":
        """
        Convert a dimension's intake score into surface optical properties.

        High raw_score → high reflectivity (claims bounce well off this dimension)
        Low raw_score → high absorptivity (claims lose energy here)
        Low confidence → high transmissivity (dimension is transparent —
                         not enough data to reflect or absorb meaningfully)

        The coefficients controlling this conversion are loaded from config
        (production) or use defaults (development/open source). These
        coefficients are part of the calibrated weight set — they determine
        HOW AGGRESSIVELY scores translate to optical properties.
        """
        if params is None:
            params = SURFACE_PARAMS

        effective_score = state.raw_score * state.confidence

        # Strong dimension: reflects energy (reinforces claims)
        reflectivity = effective_score * params["reflect_coefficient"]

        # Weak dimension: absorbs energy (contradicts claims)
        absorptivity = (1.0 - effective_score) * params["absorb_coefficient"]

        # Whatever's left passes through (uncertainty)
        transmissivity = 1.0 - reflectivity - absorptivity
        transmissivity = max(0.0, transmissivity)  # clamp

        # Renormalize
        total = reflectivity + transmissivity + absorptivity
        return cls(
            dimension=state.dimension,
            reflectivity=reflectivity / total,
            transmissivity=transmissivity / total,
            absorptivity=absorptivity / total,
        )


@dataclass
class Bounce:
    """
    A single interaction between a ray and a dimension surface.
    Records what happened when the ray hit this dimension.
    """
    dimension: Dimension
    interaction: str          # "reflect", "transmit", "absorb"
    energy_before: float      # ray energy entering this bounce
    energy_after: float       # ray energy leaving this bounce
    angle_of_incidence: float # 0-π/2, how directly the ray hit
    # angle matters: glancing hits (high angle) lose less energy on absorb


@dataclass
class Ray:
    """
    A single Monte Carlo ray tracing a claim's path through the dimension space.

    A ray starts with energy=1.0 at a source dimension, then bounces through
    other dimensions according to the CAUSAL GRAPH. Each bounce either
    reinforces (reflect), passes through (transmit), or weakens (absorb)
    the ray.

    The final energy and path tell the story of how this claim fares
    when its dimensions interact.
    """
    source: Dimension                       # where the ray originated
    energy: float = 1.0                     # current energy (starts at 1.0)
    bounces: list[Bounce] = field(default_factory=list)
    terminated: bool = False
    termination_reason: Optional[str] = None

    @property
    def path(self) -> list[Dimension]:
        """The sequence of dimensions this ray visited."""
        return [self.source] + [b.dimension for b in self.bounces]

    @property
    def bounce_count(self) -> int:
        return len(self.bounces)

    @property
    def energy_retained(self) -> float:
        """Fraction of original energy remaining (0-1)."""
        return self.energy  # started at 1.0, so this IS the fraction

    @property
    def convergence_point(self) -> Optional[Dimension]:
        """The dimension where this ray ended up (last bounce)."""
        if self.bounces:
            return self.bounces[-1].dimension
        return self.source


@dataclass
class RayBundle:
    """
    The result of a Monte Carlo ray tracing run.
    Contains all rays and the aggregate statistics.
    """
    rays: list[Ray]
    n_rays: int
    dimensions_used: list[Dimension]

    @property
    def mean_energy(self) -> float:
        """Average energy retained across all rays."""
        if not self.rays:
            return 0.0
        return sum(r.energy_retained for r in self.rays) / len(self.rays)

    @property
    def energy_std(self) -> float:
        """Standard deviation of energy — this IS the confidence interval."""
        if len(self.rays) < 2:
            return 1.0
        mean = self.mean_energy
        variance = sum((r.energy_retained - mean) ** 2 for r in self.rays) / (len(self.rays) - 1)
        return math.sqrt(variance)

    @property
    def convergence_map(self) -> dict[Dimension, int]:
        """Where rays ended up — clustering reveals structural issues."""
        counts: dict[Dimension, int] = {}
        for ray in self.rays:
            cp = ray.convergence_point
            if cp:
                counts[cp] = counts.get(cp, 0) + 1
        return counts

    @property
    def scatter_ratio(self) -> float:
        """
        How scattered vs. converged the rays are.
        Low scatter (near 0) = rays converge = consistent story.
        High scatter (near 1) = rays diverge = structural tension.
        """
        if not self.rays:
            return 1.0
        cmap = self.convergence_map
        if not cmap:
            return 1.0
        max_convergence = max(cmap.values())
        return 1.0 - (max_convergence / len(self.rays))


# ---------------------------------------------------------------------------
# Causal graph: which dimensions affect which
# ---------------------------------------------------------------------------
#
# CRITICAL IP SEPARATION:
#
#   The causal graph has TWO layers:
#
#   1. TOPOLOGY (open source, in this repo):
#      Which dimensions connect to which, and in what direction.
#      This encodes the STRUCTURE of SOC 2 audit logic — the fact that
#      access control failures cascade into data protection gaps, etc.
#      This is domain knowledge baked into the product design.
#
#   2. WEIGHTS (proprietary, loaded at runtime from local config):
#      How STRONGLY each connection influences the next dimension.
#      These are calibrated against real audit outcomes from customer data.
#      After N customers and M successful audits, these weights reflect
#      empirical reality — not educated guesses.
#
#   The weights below are DEFAULTS for development and self-hosting.
#   They are hand-tuned starting points, NOT the production weights.
#   Production weights are loaded from a config file on the running
#   instance and are NEVER committed to this repo.
#
#   A competitor who forks this repo gets the algorithm + topology +
#   default weights. They do NOT get the calibrated production weights
#   that reflect real audit outcome data. That's the moat.
#
#   See: load_causal_graph() for the runtime loading pattern.
# ---------------------------------------------------------------------------

import json
import os

# Default causal graph topology with uncalibrated starter weights.
# These are the educated guesses. Production overrides them at runtime.

DEFAULT_CAUSAL_GRAPH: dict[Dimension, list[tuple[Dimension, float]]] = {
    Dimension.ACCESS_CONTROL: [
        (Dimension.DATA_PROTECTION, 0.8),      # access gaps → data exposure
        (Dimension.OPERATIONAL_READINESS, 0.3), # access issues → operational gaps
        (Dimension.DOCUMENTATION, 0.4),         # access controls need documentation
    ],
    Dimension.DATA_PROTECTION: [
        (Dimension.ACCESS_CONTROL, 0.5),        # data classification drives access rules
        (Dimension.DOCUMENTATION, 0.6),         # data handling needs policies
        (Dimension.OPERATIONAL_READINESS, 0.4), # data incidents = operational burden
    ],
    Dimension.OPERATIONAL_READINESS: [
        (Dimension.CHANGE_MANAGEMENT, 0.7),     # no monitoring = blind deploys
        (Dimension.ACCESS_CONTROL, 0.3),        # incident response needs access controls
        (Dimension.DOCUMENTATION, 0.5),         # ops runbooks are documentation
    ],
    Dimension.CHANGE_MANAGEMENT: [
        (Dimension.OPERATIONAL_READINESS, 0.6), # bad changes cause incidents
        (Dimension.DATA_PROTECTION, 0.4),       # uncontrolled changes → data risk
        (Dimension.DOCUMENTATION, 0.5),         # change processes need docs
    ],
    Dimension.DOCUMENTATION: [
        # Documentation is special: it AMPLIFIES or MASKS all other dimensions.
        # Good docs make strong dimensions provable. Missing docs make strong
        # dimensions invisible to auditors.
        (Dimension.ACCESS_CONTROL, 0.6),
        (Dimension.DATA_PROTECTION, 0.6),
        (Dimension.OPERATIONAL_READINESS, 0.6),
        (Dimension.CHANGE_MANAGEMENT, 0.6),
    ],
}

# Default source distribution (matches the published dimension weights)
DEFAULT_SOURCE_WEIGHTS: dict[Dimension, float] = {
    Dimension.ACCESS_CONTROL: 0.25,
    Dimension.DATA_PROTECTION: 0.20,
    Dimension.OPERATIONAL_READINESS: 0.20,
    Dimension.CHANGE_MANAGEMENT: 0.15,
    Dimension.DOCUMENTATION: 0.20,
}

# Default surface conversion parameters
DEFAULT_SURFACE_PARAMS: dict[str, float] = {
    "reflect_coefficient": 0.8,   # how strongly high scores reflect
    "absorb_coefficient": 0.7,    # how strongly low scores absorb
    "bounce_reflect_boost": 0.05, # energy gained on reflection
    "bounce_transmit_loss": 0.02, # energy lost on transmission
    "bounce_absorb_loss": 0.15,   # energy lost on absorption (tune to 0.25-0.30)
}


def load_causal_graph(
    config_path: Optional[str] = None,
) -> tuple[
    dict[Dimension, list[tuple[Dimension, float]]],
    dict[Dimension, float],
    dict[str, float],
]:
    """
    Load the causal graph weights from a local config file.
    Falls back to defaults if no config exists.

    Config file location (production): /etc/driftwatch/ray_weights.json
    This file is:
      - On the local machine ONLY
      - NEVER committed to any repo
      - NEVER included in backups sent to public storage
      - Updated by the weight calibration pipeline after audit outcomes
      - Backed up ONLY to encrypted local storage (ops node ZFS)

    Returns: (causal_graph, source_weights, surface_params)
    """
    if config_path is None:
        config_path = os.environ.get(
            "DRIFTWATCH_RAY_WEIGHTS",
            "/etc/driftwatch/ray_weights.json",
        )

    if os.path.exists(config_path):
        with open(config_path, "r") as f:
            config = json.load(f)

        # Parse causal graph from JSON
        causal_graph: dict[Dimension, list[tuple[Dimension, float]]] = {}
        for source_key, targets in config.get("causal_graph", {}).items():
            source_dim = Dimension(source_key)
            causal_graph[source_dim] = [
                (Dimension(t["target"]), t["weight"])
                for t in targets
            ]

        # Parse source weights
        source_weights = {
            Dimension(k): v
            for k, v in config.get("source_weights", {}).items()
        }

        # Parse surface conversion params
        surface_params = config.get("surface_params", DEFAULT_SURFACE_PARAMS)

        return (
            causal_graph or DEFAULT_CAUSAL_GRAPH,
            source_weights or DEFAULT_SOURCE_WEIGHTS,
            surface_params,
        )

    # No config file — use defaults (development / self-hosted / open source)
    return DEFAULT_CAUSAL_GRAPH, DEFAULT_SOURCE_WEIGHTS, DEFAULT_SURFACE_PARAMS


# Active causal graph — loaded at module init, overridden by config if present
CAUSAL_GRAPH, SOURCE_WEIGHTS, SURFACE_PARAMS = load_causal_graph()


# ---------------------------------------------------------------------------
# Ray tracer engine
# ---------------------------------------------------------------------------

class RayTracer:
    """
    Monte Carlo ray tracer for compliance readiness scoring.

    Usage:
        states = [DimensionState(...), ...]
        tracer = RayTracer(states)
        bundle = tracer.trace(n_rays=1000)
        score = tracer.compute_score(bundle)
    """

    MAX_BOUNCES = 10          # prevent infinite loops
    MIN_ENERGY = 0.05         # below this, ray is considered absorbed
    ANGLE_JITTER = 0.3        # randomness in bounce angles (Monte Carlo noise)

    def __init__(
        self,
        dimension_states: list[DimensionState],
        causal_graph: Optional[dict] = None,
        source_weights: Optional[dict] = None,
        surface_params: Optional[dict] = None,
    ):
        self.states = {s.dimension: s for s in dimension_states}
        self.causal_graph = causal_graph or CAUSAL_GRAPH
        self.source_weights = source_weights or SOURCE_WEIGHTS
        self.surface_params = surface_params or SURFACE_PARAMS
        self.surfaces = {
            s.dimension: Surface.from_dimension_state(s, self.surface_params)
            for s in dimension_states
        }

    def trace(self, n_rays: int = 500, seed: Optional[int] = None) -> RayBundle:
        """
        Fire n_rays through the dimension space and collect results.

        Rays are distributed across source dimensions proportionally to the
        published dimension weights.
        """
        if seed is not None:
            random.seed(seed)

        rays: list[Ray] = []
        for _ in range(n_rays):
            # Pick source dimension weighted by configured weights
            source = self._weighted_choice(self.source_weights)
            ray = self._trace_single_ray(source)
            rays.append(ray)

        return RayBundle(
            rays=rays,
            n_rays=n_rays,
            dimensions_used=list(self.states.keys()),
        )

    def _trace_single_ray(self, source: Dimension) -> Ray:
        """Trace a single ray from source through the causal graph."""
        ray = Ray(source=source)
        current_dim = source

        for _ in range(self.MAX_BOUNCES):
            if ray.energy < self.MIN_ENERGY:
                ray.terminated = True
                ray.termination_reason = "energy_depleted"
                break

            # Get possible next dimensions from causal graph
            targets = self.causal_graph.get(current_dim, [])
            if not targets:
                ray.terminated = True
                ray.termination_reason = "no_causal_path"
                break

            # Pick next dimension weighted by causal strength + jitter
            target_weights = {
                dim: weight + random.uniform(0, self.ANGLE_JITTER)
                for dim, weight in targets
            }
            next_dim = self._weighted_choice(target_weights)

            # Compute the bounce
            surface = self.surfaces[next_dim]
            angle = random.uniform(0.1, math.pi / 2)  # angle of incidence
            bounce = self._compute_bounce(ray, surface, angle)
            ray.bounces.append(bounce)
            ray.energy = bounce.energy_after

            current_dim = next_dim

        if not ray.terminated:
            ray.terminated = True
            ray.termination_reason = "max_bounces"

        return ray

    def _compute_bounce(self, ray: Ray, surface: Surface, angle: float) -> Bounce:
        """
        Compute what happens when a ray hits a dimension surface.

        The interaction is probabilistic (Monte Carlo):
          - Roll against reflectivity/transmissivity/absorptivity
          - Angle modulates the effect (glancing = less impact)
        """
        roll = random.random()

        # Angle factor: direct hit (low angle) = full effect
        # Glancing hit (high angle) = reduced effect
        angle_factor = math.cos(angle)  # 1.0 at normal, 0.0 at grazing

        if roll < surface.reflectivity:
            # Reflect: energy BOOSTED slightly (dimension reinforces claim)
            boost = self.surface_params["bounce_reflect_boost"] * angle_factor * surface.reflectivity
            energy_after = min(1.0, ray.energy * (1.0 + boost))
            interaction = "reflect"
        elif roll < surface.reflectivity + surface.transmissivity:
            # Transmit: energy passes through with minimal loss
            loss = self.surface_params["bounce_transmit_loss"] * angle_factor
            energy_after = ray.energy * (1.0 - loss)
            interaction = "transmit"
        else:
            # Absorb: energy LOST (dimension contradicts/weakens claim)
            loss = self.surface_params["bounce_absorb_loss"] * angle_factor * surface.absorptivity
            energy_after = ray.energy * (1.0 - loss)
            interaction = "absorb"

        return Bounce(
            dimension=surface.dimension,
            interaction=interaction,
            energy_before=ray.energy,
            energy_after=energy_after,
            angle_of_incidence=angle,
        )

    def compute_score(self, bundle: RayBundle) -> "ReadinessScore":
        """
        Convert a ray bundle into a readiness score that's compatible
        with the existing 0-100 scoring system.
        """
        # Base score from mean energy retained
        raw_score = bundle.mean_energy * 100

        # Scatter penalty: high scatter = structural issues = lower score
        scatter_penalty = bundle.scatter_ratio * 10

        # Confidence from energy std dev (tighter = more confident)
        confidence = max(0.0, 1.0 - bundle.energy_std * 2)

        # Dimension-level breakdown
        dim_scores = self._per_dimension_scores(bundle)

        # Detect tension points (dimensions where rays cluster on absorb)
        tensions = self._detect_tensions(bundle)

        # Detect reinforcement paths (dimensions where rays cluster on reflect)
        reinforcements = self._detect_reinforcements(bundle)

        final_score = max(0, min(100, raw_score - scatter_penalty))

        return ReadinessScore(
            score=round(final_score, 1),
            confidence=round(confidence, 3),
            confidence_interval=(
                round(max(0, final_score - bundle.energy_std * 100), 1),
                round(min(100, final_score + bundle.energy_std * 100), 1),
            ),
            dimension_scores=dim_scores,
            tensions=tensions,
            reinforcements=reinforcements,
            scatter_ratio=round(bundle.scatter_ratio, 3),
            ray_count=bundle.n_rays,
            mean_bounces=round(
                sum(r.bounce_count for r in bundle.rays) / max(1, len(bundle.rays)), 1
            ),
        )

    def _per_dimension_scores(self, bundle: RayBundle) -> dict[str, float]:
        """Score each dimension based on ray interactions with it."""
        dim_energy: dict[Dimension, list[float]] = {d: [] for d in Dimension}

        for ray in bundle.rays:
            for bounce in ray.bounces:
                # How much energy survived this dimension
                retention = bounce.energy_after / max(0.001, bounce.energy_before)
                dim_energy[bounce.dimension].append(retention)

        return {
            dim.value: round(
                (sum(energies) / len(energies) * 100) if energies else 50.0, 1
            )
            for dim, energies in dim_energy.items()
        }

    def _detect_tensions(self, bundle: RayBundle) -> list[dict]:
        """
        Find structural tension points: dimensions that consistently
        absorb energy from rays originating at specific other dimensions.

        These are the causal chains that the weighted average misses.
        """
        # Count absorptions by (source → absorber) pair
        absorb_counts: dict[tuple[Dimension, Dimension], int] = {}
        total_by_pair: dict[tuple[Dimension, Dimension], int] = {}

        for ray in bundle.rays:
            for bounce in ray.bounces:
                pair = (ray.source, bounce.dimension)
                total_by_pair[pair] = total_by_pair.get(pair, 0) + 1
                if bounce.interaction == "absorb":
                    absorb_counts[pair] = absorb_counts.get(pair, 0) + 1

        tensions = []
        for pair, absorbs in absorb_counts.items():
            total = total_by_pair.get(pair, 1)
            ratio = absorbs / total
            if ratio > 0.4:  # >40% absorption = tension
                tensions.append({
                    "from": pair[0].value,
                    "to": pair[1].value,
                    "absorption_rate": round(ratio, 3),
                    "description": (
                        f"Claims originating from {pair[0].value} consistently "
                        f"lose energy at {pair[1].value} ({ratio:.0%} absorption rate). "
                        f"This suggests {pair[1].value} undermines {pair[0].value} claims."
                    ),
                })

        return sorted(tensions, key=lambda t: t["absorption_rate"], reverse=True)

    def _detect_reinforcements(self, bundle: RayBundle) -> list[dict]:
        """
        Find reinforcement paths: dimension pairs where rays consistently
        reflect (= the dimensions support each other's claims).
        """
        reflect_counts: dict[tuple[Dimension, Dimension], int] = {}
        total_by_pair: dict[tuple[Dimension, Dimension], int] = {}

        for ray in bundle.rays:
            for bounce in ray.bounces:
                pair = (ray.source, bounce.dimension)
                total_by_pair[pair] = total_by_pair.get(pair, 0) + 1
                if bounce.interaction == "reflect":
                    reflect_counts[pair] = reflect_counts.get(pair, 0) + 1

        reinforcements = []
        for pair, reflects in reflect_counts.items():
            total = total_by_pair.get(pair, 1)
            ratio = reflects / total
            if ratio > 0.5:  # >50% reflection = reinforcement
                reinforcements.append({
                    "from": pair[0].value,
                    "to": pair[1].value,
                    "reflection_rate": round(ratio, 3),
                    "description": (
                        f"{pair[1].value} consistently reinforces "
                        f"{pair[0].value} claims ({ratio:.0%} reflection rate). "
                        f"This is a strength pathway."
                    ),
                })

        return sorted(reinforcements, key=lambda t: t["reflection_rate"], reverse=True)

    @staticmethod
    def _weighted_choice(weights: dict) -> any:
        """Pick a key from a dict of {key: weight} proportionally."""
        items = list(weights.items())
        total = sum(w for _, w in items)
        r = random.uniform(0, total)
        cumulative = 0.0
        for item, weight in items:
            cumulative += weight
            if r <= cumulative:
                return item
        return items[-1][0]


# ---------------------------------------------------------------------------
# Output structures
# ---------------------------------------------------------------------------

@dataclass
class ReadinessScore:
    """
    The final readiness score — drop-in compatible with the existing 0-100
    system, but with richer metadata.
    """
    score: float                                  # 0-100, compatible with existing ranges
    confidence: float                             # 0-1, how tight the Monte Carlo bounds are
    confidence_interval: tuple[float, float]      # (low, high)
    dimension_scores: dict[str, float]            # per-dimension breakdown (0-100)
    tensions: list[dict]                          # structural weak points
    reinforcements: list[dict]                    # structural strong points
    scatter_ratio: float                          # 0-1, how divergent the rays are
    ray_count: int                                # how many rays were traced
    mean_bounces: float                           # avg ray path length

    @property
    def readiness_band(self) -> str:
        """Map a numeric score to a readiness band."""
        if self.score >= 80:
            return "Audit-Ready"
        elif self.score >= 60:
            return "Almost There"
        elif self.score >= 40:
            return "Building Momentum"
        elif self.score >= 20:
            return "Getting Started"
        else:
            return "Qualification Gate"

    def summary(self) -> str:
        """Human-readable summary for the Compliance Profile."""
        lines = [
            f"Readiness Score: {self.score}/100 — \"{self.readiness_band}\"",
            f"Confidence: {self.confidence:.0%} (interval: {self.confidence_interval[0]:.0f}-{self.confidence_interval[1]:.0f})",
            f"Structural coherence: {'High' if self.scatter_ratio < 0.3 else 'Medium' if self.scatter_ratio < 0.6 else 'Low'}",
            "",
            "Dimension Scores:",
        ]
        for dim, score in sorted(self.dimension_scores.items()):
            lines.append(f"  {dim}: {score}/100")

        if self.tensions:
            lines.append("")
            lines.append("Structural Tensions (dimensions that undermine each other):")
            for t in self.tensions[:3]:
                lines.append(f"  {t['from']} → {t['to']}: {t['absorption_rate']:.0%} absorption")

        if self.reinforcements:
            lines.append("")
            lines.append("Strength Pathways (dimensions that reinforce each other):")
            for r in self.reinforcements[:3]:
                lines.append(f"  {r['from']} → {r['to']}: {r['reflection_rate']:.0%} reinforcement")

        return "\n".join(lines)


# ---------------------------------------------------------------------------
# Demo / validation
# ---------------------------------------------------------------------------

def demo():
    """
    Run the ray tracer against two example companies to validate that
    it produces meaningfully different results from the weighted average.
    """
    print("=" * 70)
    print("CosmicTasha Ray Tracing Scorer — Prototype Validation")
    print("=" * 70)

    # --- Company A: Strong access control, weak documentation ---
    # Weighted average: 0.8*25 + 0.7*20 + 0.6*20 + 0.5*15 + 0.2*20 = 55.5
    # Ray model should penalize harder because documentation gaps MASK
    # all other dimensions — the auditor can't see the strong access control.

    print("\n--- Company A: Strong technical controls, weak documentation ---")
    print("Weighted average would give: 55.5/100")

    company_a = [
        DimensionState(Dimension.ACCESS_CONTROL, 0.8, 8, 0.9,
                       gaps=[], strengths=["MFA enforced", "SSO configured"]),
        DimensionState(Dimension.DATA_PROTECTION, 0.7, 6, 0.85,
                       gaps=["No data classification"], strengths=["Encryption at rest"]),
        DimensionState(Dimension.OPERATIONAL_READINESS, 0.6, 5, 0.7,
                       gaps=["No incident response plan"], strengths=["Monitoring in place"]),
        DimensionState(Dimension.CHANGE_MANAGEMENT, 0.5, 4, 0.6,
                       gaps=["No formal approval process"], strengths=["Code review required"]),
        DimensionState(Dimension.DOCUMENTATION, 0.2, 2, 0.3,
                       gaps=["Almost no formal policies", "No evidence collection"],
                       strengths=[]),
    ]

    tracer_a = RayTracer(company_a)
    bundle_a = tracer_a.trace(n_rays=1000, seed=42)
    score_a = tracer_a.compute_score(bundle_a)
    print(score_a.summary())

    # --- Company B: Mediocre everywhere but good documentation ---
    # Weighted average: 0.5*25 + 0.5*20 + 0.5*20 + 0.5*15 + 0.8*20 = 56.0
    # Ray model should score higher because documentation AMPLIFIES the
    # mediocre-but-real controls — the auditor can see and verify everything.

    print("\n--- Company B: Mediocre controls but excellent documentation ---")
    print("Weighted average would give: 56.0/100")

    company_b = [
        DimensionState(Dimension.ACCESS_CONTROL, 0.5, 8, 0.9,
                       gaps=["No SSO"], strengths=["MFA available"]),
        DimensionState(Dimension.DATA_PROTECTION, 0.5, 6, 0.8,
                       gaps=["No encryption at rest"], strengths=["Basic classification"]),
        DimensionState(Dimension.OPERATIONAL_READINESS, 0.5, 7, 0.85,
                       gaps=["Basic monitoring only"], strengths=["Incident response plan exists"]),
        DimensionState(Dimension.CHANGE_MANAGEMENT, 0.5, 5, 0.75,
                       gaps=["Manual deployments"], strengths=["Approval process documented"]),
        DimensionState(Dimension.DOCUMENTATION, 0.8, 5, 0.9,
                       gaps=[], strengths=["Formal policies", "Evidence collection process"]),
    ]

    tracer_b = RayTracer(company_b)
    bundle_b = tracer_b.trace(n_rays=1000, seed=42)
    score_b = tracer_b.compute_score(bundle_b)
    print(score_b.summary())

    # --- Comparison ---
    print("\n" + "=" * 70)
    print("COMPARISON")
    print("=" * 70)
    print(f"Company A — Weighted avg: 55.5 | Ray score: {score_a.score}")
    print(f"Company B — Weighted avg: 56.0 | Ray score: {score_b.score}")
    print(f"\nDifference (ray):   {score_b.score - score_a.score:+.1f} points")
    print(f"Difference (weighted): +0.5 points")
    print(f"\nThe ray model should show a LARGER gap because:")
    print(f"  - Company A's documentation gaps mask its strong controls")
    print(f"  - Company B's documentation amplifies its mediocre controls")
    print(f"  - An auditor would pass Company B before Company A")


if __name__ == "__main__":
    demo()
