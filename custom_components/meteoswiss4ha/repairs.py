"""Repairs: ask for a restart after the first setup, with a button that does it.

When the integration is set up while Home Assistant is already running (first
install, first place added), the cards are only offered by dashboards opened
after a restart (or a reload of the page). A repair issue says so and restarts
Home Assistant in one click; it disappears after the restart.
"""

from __future__ import annotations

from homeassistant import data_entry_flow
from homeassistant.components.repairs import RepairsFlow
from homeassistant.core import HomeAssistant
from homeassistant.helpers import issue_registry as ir

from .const import DOMAIN

RESTART_ISSUE = "restart_required"


def async_ask_restart(hass: HomeAssistant) -> None:
    """Show the "restart Home Assistant" repair."""
    ir.async_create_issue(
        hass,
        DOMAIN,
        RESTART_ISSUE,
        is_fixable=True,
        is_persistent=False,
        severity=ir.IssueSeverity.WARNING,
        translation_key=RESTART_ISSUE,
    )


def async_clear_restart(hass: HomeAssistant) -> None:
    """Remove the repair (Home Assistant has just started)."""
    ir.async_delete_issue(hass, DOMAIN, RESTART_ISSUE)


class RestartFlow(RepairsFlow):
    """Confirm, then restart Home Assistant."""

    async def async_step_init(self, user_input: dict[str, str] | None = None) -> data_entry_flow.FlowResult:
        """First step: confirm."""
        return await self.async_step_confirm()

    async def async_step_confirm(self, user_input: dict[str, str] | None = None) -> data_entry_flow.FlowResult:
        """Restart once confirmed."""
        if user_input is not None:
            self.hass.async_create_task(self.hass.services.async_call("homeassistant", "restart"))
            return self.async_create_entry(data={})
        return self.async_show_form(step_id="confirm")


async def async_create_fix_flow(hass: HomeAssistant, issue_id: str, data: dict | None) -> RepairsFlow:
    """Create the flow that fixes an issue."""
    return RestartFlow()
