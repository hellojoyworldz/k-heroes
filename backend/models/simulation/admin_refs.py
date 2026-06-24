from pydantic import BaseModel, ConfigDict

from db.models import Character, Scenario


class AdminCategoryRef(BaseModel):
    id: int
    title: str
    sort_order: int

    model_config = ConfigDict(from_attributes=True)


class AdminCharacterRef(BaseModel):
    id: int
    name: str
    sort_order: int
    category: AdminCategoryRef

    model_config = ConfigDict(from_attributes=True)


class AdminScenarioRef(BaseModel):
    id: int
    title: str
    sort_order: int

    model_config = ConfigDict(from_attributes=True)


def category_ref_from_character(character: Character) -> AdminCategoryRef:
    category = character.character_category
    return AdminCategoryRef(
        id=category.id,
        title=category.title,
        sort_order=category.sort_order,
    )


def character_ref_from_character(character: Character) -> AdminCharacterRef:
    return AdminCharacterRef(
        id=character.id,
        name=character.name,
        sort_order=character.sort_order,
        category=category_ref_from_character(character),
    )


def scenario_ref_from_scenario(scenario: Scenario) -> AdminScenarioRef:
    return AdminScenarioRef(
        id=scenario.id,
        title=scenario.title,
        sort_order=scenario.sort_order,
    )


def character_ref_from_scenario(scenario: Scenario) -> AdminCharacterRef:
    return character_ref_from_character(scenario.character)
