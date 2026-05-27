from lib.book1_seed import display_name


def test_display_name_with_aim_variant():
    assert display_name("Aim_A", "AIM_A01") == "AIM-A01"


def test_display_name_without_variant():
    assert display_name("Laptop", None) == "Laptop"
