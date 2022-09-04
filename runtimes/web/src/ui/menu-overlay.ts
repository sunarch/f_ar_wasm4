import { LitElement, html, css } from "lit";
import { customElement, state } from 'lit/decorators.js';
import { map } from 'lit/directives/map.js';

import { App } from "./app";
import * as constants from "../constants";

const optionIndex = {
    CONTINUE: 0,
    SAVE_STATE: 1,
    LOAD_STATE: 2,
    // OPTIONS: null,
    EXPORT_DISK: 3,
    IMPORT_DISK: 4,
    CLEAR_DISK: 5,
    COPY_NETPLAY_LINK: 6,
    RESET_CART: 7,
};

const options = [
    "CONTINUE",
    "SAVE STATE",
    "LOAD STATE",
    // "OPTIONS",
    "EXPORT DISK",
    "IMPORT DISK",
    "CLEAR DISK",
    "COPY NETPLAY URL",
    "RESET CART",
];

@customElement("wasm4-menu-overlay")
export class MenuOverlay extends LitElement {
    static styles = css`
        :host {
            width: 100vmin;
            height: 100vmin;
            position: absolute;

            color: #a0a0a0;
            font: 16px wasm4-font;

            display: flex;
            align-items: center;
            justify-content: center;
            flex-direction: column;

            background: rgba(0, 0, 0, 0.85);
        }

        .menu {
            border: 2px solid #f0f0f0;
            padding: 0 1em 0 1em;
            line-height: 2em;
        }

        .netplay-summary {
            margin-top: 2em;
            line-height: 1.5em;
        }

        .ping-you {
            color: #f0f0f0;
        }

        .ping-good {
            color: green;
        }

        .ping-ok {
            color: yellow;
        }

        .ping-bad {
            color: red;
        }

        ul {
            list-style: none;
            padding-left: 0;
            padding-right: 1em;
        }

        li::before {
            content: "\\00a0\\00a0";
        }
        li.selected::before {
            content: "> ";
        }
        li.selected {
            color: #fff;
        }
    `;

    app!: App;

    private lastGamepad = 0;

    @state() private selectedIdx = 0;
    @state() private netplaySummary: { playerIdx: number, ping: number }[] = [];

    private netplayPollInterval?: number;

    constructor () {
        super();
    }

    applyInput () {
        // Mix all player's gamepads together for the purposes of menu input
        let gamepad = 0;
        for (const player of this.app.inputState.gamepad) {
            gamepad |= player;
        }

        const pressedThisFrame = gamepad & (gamepad ^ this.lastGamepad);
        this.lastGamepad = gamepad;

        if (pressedThisFrame & (constants.BUTTON_X | constants.BUTTON_Z)) {
            switch (this.selectedIdx) {
            case optionIndex.CONTINUE:
                break;
            case optionIndex.SAVE_STATE:
                this.app.saveGameState();
                break;
            case optionIndex.LOAD_STATE:
                this.app.loadGameState();
                break;
            case optionIndex.EXPORT_DISK:
                this.app.exportGameDisk();
                break;
            case optionIndex.IMPORT_DISK:
                this.app.importGameDisk();
                break;
            case optionIndex.CLEAR_DISK:
                this.app.clearGameDisk();
                break;
            case optionIndex.COPY_NETPLAY_LINK:
                this.app.copyNetplayLink();
                break;
            case optionIndex.RESET_CART:
                this.app.resetCart();
                break;
            }
            this.app.closeMenu();
        }

        if (pressedThisFrame & constants.BUTTON_DOWN) {
            this.selectedIdx++;
        }
        if (pressedThisFrame & constants.BUTTON_UP) {
            this.selectedIdx--;
        }
        this.selectedIdx = (this.selectedIdx + options.length) % options.length;
    }

    connectedCallback () {
        super.connectedCallback();

        const updateNetplaySummary = () => {
            this.netplaySummary = this.app.getNetplaySummary();
        };
        updateNetplaySummary();
        this.netplayPollInterval = window.setInterval(updateNetplaySummary, 1000);
    }

    disconnectedCallback () {
        window.clearInterval(this.netplayPollInterval);

        super.disconnectedCallback();
    }

    render () {
        return html`
            <div class="menu">
                <ul>
                    ${map(options, (option, idx) =>
                        html`<li class="${this.selectedIdx == idx ? "selected" : ""}"}>${option}</li>`)}
                </ul>
            </div>
            <div class="netplay-summary">
                ${map(this.netplaySummary, player => {
                    const pingClass = player.ping < 100 ? "good" : player.ping < 200 ? "ok" : "bad";
                    const ping = (player.ping < 0)
                        ? html`<span class="ping-you">YOU</span>`
                        : html`<span class="ping-${pingClass}">${Math.ceil(player.ping)}ms</span>`;
                    return html`<div>PLAYER ${player.playerIdx >= 0 ? player.playerIdx+1 : "?"} ${ping}</div>`;
                })}
            </div>
        `;
    }
}

declare global {
    interface HTMLElementTagNameMap {
        "wasm4-menu-overlay": MenuOverlay;
    }
}
