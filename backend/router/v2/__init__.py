# Re-export routers to maintain backward compatibility with imports in main.py and tests
from router.v2.auth import auth as auth
from router.v2.auth import admin_auth as admin_auth
from router.v2.auth import admin_user as admin_user

from router.v2.character import character as character
from router.v2.character import character_category as character_category

from router.v2.scenario import scenario as scenario
from router.v2.scenario import turn as turn
from router.v2.scenario import ending as ending

from router.v2.simulation import simulation as simulation
from router.v2.simulation import admin_play_session as admin_play_session
from router.v2.simulation import landing as landing
