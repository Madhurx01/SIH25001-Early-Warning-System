"""Synthetic clustered community signals for government-side demonstration.

Each item represents one incident cluster, not one disease case. Nearby report
counts are illustrative and no record confirms disease, contamination, or a
causal health outcome without official verification.
"""

from copy import deepcopy
from typing import Any


DEMO_COMMUNITY_REPORTS: list[dict[str, Any]] = [
    {
        "id": "CR-001",
        "village_id": "ASM-HLK-004",
        "village_name": "Demo Village 04",
        "category": "STAGNANT_WATER",
        "description": "Standing water reported near the government school",
        "latitude": 24.80,
        "longitude": 92.70,
        "reported_at": "2026-08-19T16:30:00",
        "photo_url": None,
        "evidence_type": "DEMO_PHOTO_PLACEHOLDER",
        "report_count_nearby": 6,
        "verification_status": "UNVERIFIED",
        "priority": "HIGH",
        "data_source": "synthetic",
    },
    {
        "id": "CR-002",
        "village_id": "ASM-HLK-004",
        "village_name": "Demo Village 04",
        "category": "SEWAGE_OVERFLOW",
        "description": "Overflowing drain reported near Community Well W04",
        "latitude": 24.81,
        "longitude": 92.69,
        "reported_at": "2026-08-19T15:45:00",
        "photo_url": None,
        "evidence_type": "DEMO_PHOTO_PLACEHOLDER",
        "report_count_nearby": 8,
        "verification_status": "UNVERIFIED",
        "priority": "HIGH",
        "data_source": "synthetic",
    },
    {
        "id": "CR-003",
        "village_id": "ASM-CCH-001",
        "village_name": "Demo Village 01",
        "category": "FLOODED_AREA",
        "description": "Flooded residential lane reported after heavy rainfall",
        "latitude": 24.77,
        "longitude": 92.73,
        "reported_at": "2026-08-19T13:20:00",
        "photo_url": None,
        "evidence_type": "DEMO_PHOTO_PLACEHOLDER",
        "report_count_nearby": 4,
        "verification_status": "UNDER_REVIEW",
        "priority": "HIGH",
        "data_source": "synthetic",
    },
    {
        "id": "CR-004",
        "village_id": "ASM-KRG-005",
        "village_name": "Demo Village 05",
        "category": "SUSPECTED_DIRTY_WATER_SOURCE",
        "description": "Community well reported with unusual colour and odour",
        "latitude": 24.86,
        "longitude": 92.36,
        "reported_at": "2026-08-18T10:10:00",
        "photo_url": None,
        "evidence_type": "DEMO_PHOTO_PLACEHOLDER",
        "report_count_nearby": 3,
        "verification_status": "VERIFIED_HAZARD",
        "priority": "HIGH",
        "data_source": "synthetic",
    },
    {
        "id": "CR-005",
        "village_id": "MNP-IMP-007",
        "village_name": "Demo Village 07",
        "category": "BROKEN_WATER_PIPELINE",
        "description": "Leaking distribution pipe reported beside the market road",
        "latitude": 24.82,
        "longitude": 93.01,
        "reported_at": "2026-08-18T08:40:00",
        "photo_url": None,
        "evidence_type": "DEMO_PHOTO_PLACEHOLDER",
        "report_count_nearby": 2,
        "verification_status": "UNVERIFIED",
        "priority": "MEDIUM",
        "data_source": "synthetic",
    },
    {
        "id": "CR-006",
        "village_id": "MNP-UKL-009",
        "village_name": "Demo Village 09",
        "category": "GARBAGE_NEAR_WATER_SOURCE",
        "description": "Waste accumulation reported beside a shared water point",
        "latitude": 25.10,
        "longitude": 94.36,
        "reported_at": "2026-08-17T17:15:00",
        "photo_url": None,
        "evidence_type": "DEMO_PHOTO_PLACEHOLDER",
        "report_count_nearby": 1,
        "verification_status": "UNVERIFIED",
        "priority": "MEDIUM",
        "data_source": "synthetic",
    },
    {
        "id": "CR-007",
        "village_id": "MIZ-AIZ-011",
        "village_name": "Demo Village 11",
        "category": "SUSPECTED_MOSQUITO_BREEDING_SITE",
        "description": "Discarded containers holding rainwater reported near housing",
        "latitude": 23.73,
        "longitude": 92.72,
        "reported_at": "2026-08-17T12:05:00",
        "photo_url": None,
        "evidence_type": "DEMO_PHOTO_PLACEHOLDER",
        "report_count_nearby": 5,
        "verification_status": "UNVERIFIED",
        "priority": "MEDIUM",
        "data_source": "synthetic",
    },
]


def get_community_reports() -> list[dict[str, Any]]:
    """Return newest-first synthetic incident clusters."""
    return deepcopy(
        sorted(DEMO_COMMUNITY_REPORTS, key=lambda report: report["reported_at"], reverse=True)
    )
