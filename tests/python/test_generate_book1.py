from scripts.generate_book1_asset_ids import INVENTORY


def test_inventory_groups_have_required_keys():
    assert len(INVENTORY) >= 1
    group = INVENTORY[0]
    for key in ("label", "asset_type", "count", "specs", "codes"):
        assert key in group
