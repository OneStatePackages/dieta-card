import { LitElement, html, css } from 'https://unpkg.com/lit@2.8.0/index.js?module';
import { loadHaComponents, DEFAULT_HA_COMPONENTS } from 'https://cdn.jsdelivr.net/npm/@kipk/load-ha-components/+esm';
loadHaComponents([...DEFAULT_HA_COMPONENTS, 'ha-selector', 'ha-textfield', 'ha-textarea']).catch(()=>{});
const DIET_I18N = {
  it: {
    card_title: 'Dieta Settimanale',
    settings_title: 'Impostazioni Dieta',
    no_data: 'Nessun dato salvato',
    entity_not_found: 'Entità non trovata',
    theme: 'Tema',
    save_day: '📂 Salva Giorno',
    reset_day: '♻️ Reset Giorno',
    remaining: 'rimanenti',
    notifica: 'Notifica',
    orario_notifica: 'Orario Notifica',
    days: {
      monday: 'Lunedì',
      tuesday: 'Martedì',
      wednesday: 'Mercoledì',
      thursday: 'Giovedì',
      friday: 'Venerdì',
      saturday: 'Sabato',
      sunday: 'Domenica'
    },
    meals: {
      breakfast: 'Colazione',
      lunch: 'Pranzo',
      dinner: 'Cena',
      snack: 'Snack'
    },
    breakfast: 'Colazione',
    lunch: 'Pranzo',
    dinner: 'Cena',
    snack: 'Snack'
  },
  en: {
    card_title: 'Weekly Diet',
    settings_title: 'Diet Settings',
    no_data: 'No data saved',
    entity_not_found: 'Entity not found',
    theme: 'Theme',
    save_day: '📂 Save Day',
    reset_day: '♻️ Reset Day',
    remaining: 'remaining',
    notifica: 'Notification',
    orario_notifica: 'Notification Time',
    days: {
      monday: 'Monday',
      tuesday: 'Tuesday',
      wednesday: 'Wednesday',
      thursday: 'Thursday',
      friday: 'Friday',
      saturday: 'Saturday',
      sunday: 'Sunday'
    },
    meals: {
      breakfast: 'Breakfast',
      lunch: 'Lunch',
      dinner: 'Dinner',
      snack: 'Snack'
    },
    breakfast: 'Breakfast',
    lunch: 'Lunch',
    dinner: 'Dinner',
    snack: 'Snack'
  }
};

const ENTITY_GIORNO = 'input_select.diet_day';
const ENTITY_LANG  = 'input_select.diet_language';
const ENT = {
  col: 'input_text.diet_breakfast',
  pra: 'input_text.diet_lunch',
  cen: 'input_text.diet_dinner',
  sna: 'input_text.diet_snack'
};
const SCRIPT_SALVA = 'script.save_diet_split_json';
const SCRIPT_RESET = 'script.reset_diet_split_json';
const SENSOR_SETT = 'sensor.weekly_diet';
class DietaCardEditor extends LitElement {
  static properties = {
    hass:   { attribute: false },
    _config:{ state: true },
    _draft: { state: true }
  };

  constructor() {
    super();
    this._config = { tema: 'default' };
    this._draft = {};
  }

  set hass(h) {
    this._hass = h;
    this._draft = {};
  }
  get hass() { return this._hass; }

  setConfig(config) {
    this._config = config;
  }

  _updateConfig(key, value) {
    const newConfig = {
      ...this._config,
      [key]: value
    };
    this._config = newConfig;
    this.dispatchEvent(new CustomEvent('config-changed', {
      detail: { config: newConfig }
    }));
  }

  static styles = css`
    .form   { display:flex; flex-direction:column; gap:12px; padding:16px }
    .field  { display:flex; flex-direction:column; gap:4px }
    ha-textfield, ha-textarea { width:100% }
    .actions{ display:flex; gap:8px; margin-top:8px }
    mwc-button[dense] {
    	--mdc-typography-button-font-size: 12px;
    	--mdc-button-horizontal-padding: 8px;
    	width: 25%;
    }
    .dieta-divider {
      border: none;
      height: 1px;
      background-color: var(--divider-color, #ccc);
      margin: 16px 0;
    }
  `;

  _getLang() {
    return this.hass?.language || 'en';
  }

  _t(key) {
    const lang = this._getLang();
    return DIET_I18N[lang]?.[key] ?? DIET_I18N['en'][key] ?? key;
  }
  _toggleCompact() {
    this._updateConfig('compact', !this._config.compact);
  }
  render() {
    const lang = this._getLang();
    const daysObj = DIET_I18N[lang]?.days || DIET_I18N['en'].days;
    const daysArr = Object.entries(daysObj).map(([value, label]) => ({ value, label }));
    const currentDay = this.hass?.states?.[ENTITY_GIORNO]?.state || daysArr[0].value;
    const THEMES = [
      { value: 'default', label: 'Default' },
      { value: 'dark',    label: 'Dark' },
      { value: 'pastel',  label: 'Pastel' },
      { value: 'neon',    label: 'Neon' }
    ];
    return html`
      <div class="form">
        <div class="field">
          <span>${this._t('theme')}</span>
          <ha-selector
            .hass=${this.hass}
            .selector=${{
              select: {
                options: THEMES,
                mode: 'dropdown'
              }
            }}
            .value=${this._config?.tema || 'default'}
            @value-changed=${e => this._updateConfig('tema', e.detail.value)}
          ></ha-selector>
        </div>

        <div class="field horizontal">
          <span>Compact:</span>
          <mwc-button @click=${() => this._toggleCompact()} outlined dense>
            ${this._config.compact ? 'Disattiva' : 'Attiva'}
          </mwc-button>
        </div>

        <hr class="dieta-divider">
        <ha-selector
          .hass=${this.hass}
          .selector=${{
            select: { options: daysArr }
          }}
          .value=${currentDay}
          @value-changed=${e => this._setGiorno(e.detail.value)}
        ></ha-selector>

        <div class="actions">
          <mwc-button @click=${this._salva} outlined>${this._t('save_day')}</mwc-button>
          <mwc-button @click=${this._reset} outlined>${this._t('reset_day')}</mwc-button>
        </div>

        ${this._field(this._t('breakfast'),'col')}
        ${this._field(this._t('lunch'),'pra')}
        ${this._field(this._t('dinner'),'cen')}
        ${this._field(this._t('snack'),'sna')}
      </div>
    `;
  }

  _field(label, key) {
    const value = (this._draft[key] !== undefined)
      ? this._draft[key]
      : (this.hass?.states?.[ENT[key]]?.state || '');
    const len = value.length;
    return html`
      <div class="field">
        <div style="display:flex; justify-content:space-between; align-items:center;">
          <span>${label}</span>
          <span style="font-size: 11px; color: #999;">
            ${255 - len} ${this._t('remaining')}
          </span>
        </div>
        <ha-textarea
          .value=${value}
          @input=${e => this._onTextChanged(key, e.target.value)}
          rows="4"
        ></ha-textarea>
      </div>`;
  }

  _onTextChanged(key, value) {
    this._draft[key] = value;
    const entity = ENT[key];
    if (entity && this.hass) {
      this.hass.callService('input_text', 'set_value', {
        entity_id: entity,
        value: value
      });
    }
    this.requestUpdate();
  }

  _setGiorno(value) {
    this.hass.callService('input_select', 'select_option', {
      entity_id: ENTITY_GIORNO,
      option: value
    });
    this._draft = {};
    setTimeout(() => this.requestUpdate(), 350);
  }

  _salva() {
    this.hass.callService('script','turn_on',{ entity_id: SCRIPT_SALVA });
    this._draft = {};
    setTimeout(() => this.requestUpdate(), 600);
  }

  _reset() {
    Object.values(ENT).forEach(entity_id => {
      this.hass.callService('input_text', 'set_value', {
        entity_id,
        value: ''
      });
    });
    this.hass.callService('script','turn_on',{ entity_id: SCRIPT_RESET });
    this._draft = { col: '', pra: '', cen: '', sna: '' };
    setTimeout(() => {
      this._draft = {};
      this.requestUpdate();
    }, 600);
  }
}

customElements.define('dieta-card-editor', DietaCardEditor);
const DIET_ENTITIES = {
  edit_active:   'input_text.diet_edit_active',
  breakfast:     'input_text.diet_breakfast',
  lunch:         'input_text.diet_lunch',
  dinner:        'input_text.diet_dinner',
  snack:         'input_text.diet_snack',
  day:           'input_select.diet_day',
  weekly_diet:   'sensor.weekly_diet',
  notification_time:  'input_datetime.diet_notification_time',
  notification_switch:'input_boolean.diet_notification_switch',
  script_save:   'script.save_diet_split_json',
  script_reset_input:'script.reset_input_text_diet',
  script_reset:  'script.reset_diet_split_json'
};
class DietaCard extends HTMLElement {
  static get properties() {
    return {
      hass: { type: Object },
      config: { type: Object }
    };
  }

  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.currentSlide = -1;
    this.touchStartX = 0;
    this._sensor = this.config?.entity;
    this._prevState = null;
  }

  setConfig(config) {
    if (!config.entity) throw new Error('Please define an entity');
    this.config = config;
    this._sensor = config.entity;
    this._tema = config.tema;
    this.render();
    this._compact = config.compact || false;
  }

  set hass(hass) {
    const current = JSON.stringify(hass?.states?.[this._sensor]);
    const changed = current !== this._prevState;

    if (changed) {
      this._hass = hass;
      this._prevState = current;
      this.render();
    }
  }

  static getStubConfig() {
    return {
      entity: DIET_ENTITIES.weekly_diet,
      title: 'Dieta Settimanale',
      tema: 'default'
    };
  }

  static getConfigElement() {
    return document.createElement('dieta-card-editor');
  }

  handleTouchStart(e) {
    this.touchStartX = e.touches[0].clientX;
  }

  handleTouchMove(e) {
    if (!this.touchStartX) return;

    const touchEndX = e.touches[0].clientX;
    const diff = this.touchStartX - touchEndX;
    const container = this.shadowRoot.querySelector('.diet-container');
    const cards = this.shadowRoot.querySelectorAll('.day-card');

    if (Math.abs(diff) > 50) {
      if (diff > 0 && this.currentSlide < cards.length - 1) {
        this.currentSlide++;
      } else if (diff < 0 && this.currentSlide > 0) {
        this.currentSlide--;
      }

      const scrollPosition = this.currentSlide * (cards[0].offsetWidth + 16);
      container.scrollTo({
        left: scrollPosition,
        behavior: 'smooth'
      });

      this.updatePagination();
      this.touchStartX = null;
    }
  }

  updatePagination() {
    const dots = this.shadowRoot.querySelectorAll('.dieta-pagination-dot');
    dots.forEach((dot, index) => {
      dot.classList.toggle('active', index === this.currentSlide);
    });
  }

  connectedCallback() {
    this.shadowRoot.addEventListener('touchstart', (e) => this.handleTouchStart(e));
    this.shadowRoot.addEventListener('touchmove', (e) => this.handleTouchMove(e));
    window._dietaCardInstance = this;
  }
  disconnectedCallback() {
    this.shadowRoot.removeEventListener('touchstart', this.handleTouchStart);
    this.shadowRoot.removeEventListener('touchmove', this.handleTouchMove);

    if (window._dietaCardInstance === this) {
      delete window._dietaCardInstance;
    }
  }
  _toggleNotificaSwitch(value) {
    this._hass.callService('input_boolean', value ? 'turn_on' : 'turn_off', {
      entity_id: DIET_ENTITIES.notification_switch
    });
  }
  getModalContent(type) {
    const lang = this._hass?.language?.substring(0, 2) || 'en';
    const I18N = DIET_I18N[lang] || DIET_I18N.en;
    if (type === 'settings') {
      const orario = (this._hass.states[DIET_ENTITIES.notification_time]?.state || '08:00').slice(0, 5);
      const switchState = this._hass.states[DIET_ENTITIES.notification_switch]?.state === 'on';

      return `
        <div class="dieta-popup-header">
          <h2>${I18N.settings_title}</h2>
        </div>

        <div class="dieta-setting-row">
          <span>📢 ${I18N.notifica}</span>
          <label class="switch">
            <input type="checkbox" ${switchState ? 'checked' : ''}
              onchange="window._dietaCardInstance._toggleNotificaSwitch(this.checked)">
            <span class="slideround"></span>
          </label>
        </div>

        <div class="dieta-setting-row">
          <span>⏰ ${I18N.orario_notifica}</span>
          <input type="time"
            value="${orario}"
            onchange="window._dietaCardInstance._salvaOrarioDieta(this.value)">
        </div>
      `;
    }

    return `<p>Errore: tipo modal sconosciuto</p>`;
  }

  _salvaOrarioDieta(valore) {
    this._hass.callService('input_datetime', 'set_datetime', {
      entity_id: DIET_ENTITIES.notification_time,
      time: valore
    });
  }
  toggleModal(type) {
    const tema = this._tema || this.config?.tema || 'default';
    this.render();
    window._dietaCardInstance = this;
    const existingStyle = document.getElementById('dieta-modal-style');
    if (!existingStyle) {
      const style = document.createElement('style');
      style.id = 'dieta-modal-style';
      style.textContent = `
        .dieta-modal-overlay {
          position: fixed;
          top: 0; left: 0; right: 0; bottom: 0;
          background: rgba(0, 0, 0, 0.6);
          backdrop-filter: blur(8px);
          display: flex;
          justify-content: center;
          align-items: center;
          z-index: 9999;
        }

        .switch {
          position: relative;
          display: inline-block;
          width: 42px;
          height: 24px;
          vertical-align: middle;
        }
        .switch input {
          opacity: 0;
          width: 0;
          height: 0;
        }
        .slideround {
          position: absolute;
          cursor: pointer;
          top: 0; left: 0; right: 0; bottom: 0;
          background-color: var(--switch-bg-off, #888);
          transition: .4s;
          border-radius: 24px;
          max-width: none;
        }
        .slideround:before {
          position: absolute;
          content: "";
          height: 18px;
          width: 18px;
          left: 3px;
          bottom: 3px;
          background-color: var(--switch-thumb, #ffffff);
          transition: .4s;
          border-radius: 50%;
        }
        .switch input:checked + .slideround {
          background-color: var(--switch-bg-on, var(--icon-color, #4caf50));
        }
        .switch input:checked + .slideround:before {
          transform: translateX(18px);
        }

        .dieta-popup-content {
          padding: 24px;
          border-radius: 16px;
          max-width: 350px;
          width: 90%;
          position: relative;
          font-family: var(--paper-font-common-base_-_font-family);
          box-shadow: 0 10px 30px rgba(0,0,0,0.3);
        }

        .dieta-popup-content.default {
          background: #f9fafb;
          color: #111827;
          --divider-color: #e5e7eb;
        }
        .dieta-popup-content.dark {
          background: #121212;
          color: #e0e0e0;
          --divider-color: #444;
        }
        .dieta-popup-content.pastel {
          background: #fffaf3;
          color: #3f3f46;
          --divider-color: #f3e8d2;
        }
        .dieta-popup-content.neon {
          background: #0e142b;
          color: #c0d6f9;
          box-shadow: 0 0 16px rgba(0,229,255,0.7), 0 0 32px rgba(160,32,240,0.5);
          animation: neonGlow 1.5s ease-in-out infinite alternate;
          --divider-color: #4e5d7a;
        }

        @keyframes neonGlow {
          from { box-shadow: 0 0 16px rgba(0,229,255,0.7), 0 0 32px rgba(160,32,240,0.5); }
          to   { box-shadow: 0 0 24px rgba(0,229,255,1), 0 0 48px rgba(160,32,240,0.8); }
        }

        .dieta-popup-content h2 {
          margin-top: 0;
          font-size: 20px;
          font-weight: bold;
        }

        .dieta-setting-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 12px 0;
          font-size: 16px;
          border-top: 1px solid var(--divider-color);
        }

        .dieta-popup-content input[type="time"] {
          padding: 6px;
          border-radius: 6px;
          border: 1px solid var(--divider-color);
          background: transparent;
          color: inherit;
          font-size: 16px;
        }

        .dieta-chiudi {
          position: absolute;
          top: 12px;
          right: 12px;
          background: var(--card-inner-bg);
          border: none;
          border-radius: 50%;
          width: 28px;
          height: 28px;
          font-size: 16px;
          cursor: pointer;
          color: inherit;
        }
      `;
      document.head.appendChild(style);
    }

    // Costruzione dinamica DOM
    const overlay = document.createElement('div');
    overlay.className = 'dieta-modal-overlay';
    overlay.onclick = () => overlay.remove();

    const content = document.createElement('div');
    content.className = `dieta-popup-content ${tema}`;
    content.onclick = e => e.stopPropagation();
    content.innerHTML = `
      ${this.getModalContent(type)}
      <button class="dieta-chiudi" onclick="this.closest('.dieta-modal-overlay').remove()">✖</button>
    `;

    overlay.appendChild(content);
    document.body.appendChild(overlay);
  }
  /* ---------- UTILITY SCROLL ---------- */
  _scrollToCurrent() {
    const container = this.shadowRoot.querySelector('.diet-container');
    const card      = this.shadowRoot.querySelector('.day-card');
    if (!container || !card) return;

    const pos = this.currentSlide * (card.offsetWidth + 16);
    container.scrollTo({ left: pos, behavior: 'auto' });
  }

  /* ---------- TROVA INDICE GIORNO CORRENTE ---------- */
  getTodayIndex(dietPlan) {
    const todayKeys = [
      new Date().toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase(), // friday
      new Date().toLocaleDateString('it-IT', { weekday: 'long' }).toLowerCase()  // venerdì
    ];

    const found = dietPlan.findIndex(day => {
      const key = (day.day || day.giorno || '').toLowerCase();
      return todayKeys.includes(key);
    });
    if (found !== -1) return found;

    // Monday-first fallback (Mon=0 … Sun=6)
    return (new Date().getDay() + 6) % 7;
  }

  /* ---------- RENDER ---------- */
  render() {
    if (!this._hass || !this.config) return;

    /* ---- DATI BASE ---- */
    const lang     = this._hass?.language?.substring(0,2) || 'en';
    const I18N     = DIET_I18N[lang] || DIET_I18N.en;
    const entityId = this.config.entity;
    const title    = this.config.title || I18N.card_title;
    const state    = this._hass.states[entityId];
    const tema     = ['default','dark','pastel','neon'].includes(this._tema) ? this._tema : this.config?.tema;

    /* ---- HEADER ---- */
    const cardHeader = `
      <div class="dieta-card-header">
        <div class="dieta-header-left">
          <div class="icon"><ha-icon icon="mdi:calendar-clock"></ha-icon></div>
          <h2>${title}</h2>
        </div>
        <div class="dieta-settings-btn" onclick="this.getRootNode().host.toggleModal('settings')">
          <ha-icon icon="mdi:cog" title="${I18N.settings_title}"></ha-icon>
        </div>
      </div>`;

    /* ---- VALIDAZIONI ---- */
    if (!state) {
      this.shadowRoot.innerHTML = `
        <ha-card class="${tema} ${this._compact ? 'compact' : ''}">${cardHeader}
          <div class="card-content">${I18N.entity_not_found}: ${entityId}</div>
        </ha-card>
        <style>${DietaCard.styles}</style>`;
      return;
    }

    const dietPlan = state.attributes.yaml_list || [];
    if (!dietPlan.length) {
      this.shadowRoot.innerHTML = `
        <ha-card class="${tema} ${this._compact ? 'compact' : ''}">${cardHeader}
          <div class="card-content">${I18N.no_data}</div>
        </ha-card>
        <style>${DietaCard.styles}</style>`;
      return;
    }

    /* ---- SLIDE INIZIALE ---- */
    if (this.currentSlide === -1) this.currentSlide = this.getTodayIndex(dietPlan);

    /* ---- COSTANTI UI ---- */
    const mealIcons = {
      breakfast:'mdi:coffee', lunch:'mdi:food-fork-drink',
      dinner:'mdi:moon-waning-crescent', snack:'mdi:cookie'
    };

    const navigationButtons = `
      <div class="navigation-buttons">
        <button class="nav-button prev" onclick="this.getRootNode().host.navigate(-1)">
          <ha-icon icon="mdi:chevron-left"></ha-icon>
        </button>
        <button class="nav-button next" onclick="this.getRootNode().host.navigate(1)">
          <ha-icon icon="mdi:chevron-right"></ha-icon>
        </button>
      </div>`;

    const paginationDots = `
      <div class="dieta-pagination">
        ${dietPlan.map((_,i)=>`<span class="dieta-pagination-dot ${i===this.currentSlide?'active':''}"></span>`).join('')}
      </div>`;

    /* ---- TEMPLATE ---- */
    this.shadowRoot.innerHTML = `
      <ha-card class="${tema} ${this._compact ? 'compact' : ''}">
        ${cardHeader}
        ${navigationButtons}
        <div class="card-content">
          <div class="diet-container">
            ${dietPlan.map(day=>{
              const key=(day.giorno||day.day||'').toLowerCase();
              const label=I18N.days[key]||day.giorno||day.day||'';
              return `
                <div class="day-card">
                  <div class="day-header">
                    <ha-icon icon="mdi:calendar-today"></ha-icon><span>${label}</span>
                  </div>
                  ${Object.entries(mealIcons).map(([meal,icon])=>`
                    <div class="meal-row">
                      <div class="meal-icon"><ha-icon icon="${icon}"></ha-icon></div>
                      <div class="meal-content">
                        <div class="meal-type">${I18N.meals[meal]}</div>
                        <div class="meal-desc">${(day[meal]||'').replace(/\\n/g,'<br>')}</div>
                      </div>
                    </div>`).join('')}
                </div>`;
            }).join('')}
          </div>
          ${paginationDots}
        </div>
      </ha-card>
      <style>${DietaCard.styles}</style>`;

    /* ---- SCROLL AL GIORNO CORRENTE ---- */
    requestAnimationFrame(()=>this._scrollToCurrent());
  }


  navigate(direction) {
    const container = this.shadowRoot.querySelector('.diet-container');
    const cards = this.shadowRoot.querySelectorAll('.day-card');

    this.currentSlide = Math.max(0, Math.min(this.currentSlide + direction, cards.length - 1));
    const scrollPosition = this.currentSlide * (cards[0].offsetWidth + 16);

    container.scrollTo({
      left: scrollPosition,
      behavior: 'smooth'
    });

    this.updatePagination();
  }

  static get styles() {
    return `
      :host {
        display: flex !important;
        justify-content: center !important;
        width: 100% !important;
      }
      ha-card {
        display: block;
        box-sizing: border-box;
        width: 100%;
        height: auto;
        margin: 0;
        padding: 0;
        border-radius: var(--ha-card-border-radius, 12px);
        box-shadow: var(--ha-card-box-shadow, var(--mdc-elevation--z2));
        background-color: var(--ha-card-background, white);
        overflow: hidden;
        position: relative;
        margin-top: 10px;
        margin-bottom: 10px;
      }
      ha-card.compact {
      	max-width: 350px !important;
      	font-size: 13px;
      	background: none !important;
      	box-shadow: none !important;
      	border: none !important;
      	/* padding: 0 !important; */
      	/* margin-top: 20px !important; */
      	margin-bottom: 0 !important;
      	overflow: visible;
      }
      ha-card.compact .dieta-card-header {
      	height: 0;
      	overflow: visible;
      	position: absolute;
      	z-index: 1;
        bottom: 20px;
      }
      ha-card.compact .dieta-header-left {
        display: none;
      }
      ha-card.compact .day-card {
        padding: 10px;
        border-radius: 10px;
      }

      ha-card.compact .meal-row {
        margin: 6px 0;
      }

      ha-card.compact .meal-desc {
        font-size: 13px;
        max-height: 2.4em;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
      ha-card.compact .navigation-buttons {
          display: flex;
          position: absolute;
          bottom: 15px;
          margin-left: 80%;
          transform: translateX(-50%);
          display: flex;
          justify-content: center;
          gap: 12px;
      }
      ha-card.compact .nav-button {
        width: 28px;
        height: 28px;
      }
      ha-card.compact .dieta-settings-btn {
        display: flex;
        position: absolute;
      }
      ha-card.compact .dieta-pagination-dot {
        display: none;
      }
      ha-card.compact .dieta-pagination {
        display: none;
      }
      ha-card.compact .day-card {
        box-shadow: none;
      }
      .dieta-card-header {
        position: relative;
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 12px;
        font-size: 15px;
        padding: 20px;
        color: var(--card-color, var(--primary-text-color));
      }
      .dieta-modal-overlay {
        position: fixed;
        top: 0; left: 0; right: 0; bottom: 0;
        background: rgba(0, 0, 0, 0.6);
        backdrop-filter: blur(8px);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 1000;
      }

      .dieta-popup-content {
        background: var(--ha-card-background, white);
        padding: 24px;
        border-radius: 20px;
        text-align: center;
        color: var(--primary-text-color, #111);
        width: 90%;
        max-width: 300px;
        position: relative;
        font-family: var(--primary-font-family, sans-serif);
      }

      .dieta-popup-header h2 {
        margin: 0 0 16px;
        font-size: 20px;
        font-weight: 600;
        color: var(--primary-text-color, #111);
      }

      .dieta-setting-row {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 12px 0;
        font-size: 16px;
        border-top: 1px solid var(--divider-color, #eee);
      }

      input[type="time"] {
        padding: 6px 10px;
        font-size: 16px;
        border: 1px solid var(--input-border-color, #ccc);
        border-radius: 8px;
        background-color: var(--input-background-color, #fff);
        color: var(--primary-text-color, #111);
      }

      .dieta-chiudi {
        position: absolute;
        top: 12px;
        right: 12px;
        background: var(--secondary-background-color, #ccc);
        border: none;
        border-radius: 50%;
        padding: 4px 8px;
        cursor: pointer;
        color: var(--primary-text-color, #111);
      }


      .dieta-header-left {
        display: flex;
        align-items: center;
        gap: 10px;
      }

      .dieta-settings-btn {
        cursor: pointer;
        background: transparent;
        border-radius: 50%;
        padding: 6px;
        transition: transform 0.2s;
        display: flex;
        align-items: center;
        justify-content: center;
      }
      .dieta-settings-btn:hover {
        transform: scale(1.2);
      }
      .dieta-settings-btn ha-icon {
        --mdc-icon-size: 20px;
        color: var(--icon-color, #6366f1);
      }


      .icon ha-icon {
        color: var(--icon-color, var(--primary-color));
      }

      .diet-container {
        display: flex;
        overflow-x: auto;
        scroll-snap-type: x mandatory;
        scrollbar-width: none;
        border-radius: 16px;
        padding: 0 8px 8px;
        box-sizing: border-box;
        max-width: 100%;
        position: relative;
        croll-snap-type: x mandatory;
        -webkit-overflow-scrolling: touch;
      }

      .diet-container::-webkit-scrollbar {
        display: none;
      }
      .day-card {
      	flex: 0 0 100%;
      	margin: 0px 5px;
      	padding: 16px;
      	border-radius: 16px;
      	background: var(--card-inner-bg, #fff);
      	box-shadow: 0 6px 20px rgba(0,0,0,0.15);
      	color: var(--card-color, var(--primary-text-color));
      	box-sizing: border-box;
      	scroll-snap-align: center;
      }
      .day-header {
        background: var(--header-bg, #6366f1);
        color: var(--header-text, #fff);
        font-weight: 700;
        font-size: 16px;
        border-radius: 12px 12px 0 0;
        padding: 12px 16px;
        display: flex;
        align-items: center;
        gap: 8px;
      }

      .meal-row {
        display: flex;
        align-items: flex-start;
        gap: 10px;
        margin: 12px 0;
      }

      .meal-icon {
        width: 24px;
        height: 24px;
        display: flex;
        align-items: center;
        justify-content: center;
      }

      .meal-type {
        font-weight: 600;
        font-size: 14px;
        margin-bottom: 2px;
        color: var(--meal-title, var(--primary-text-color));
      }

      .meal-desc {
        font-size: 14px;
        color: var(--meal-desc, var(--secondary-text-color));
        white-space: normal;
        word-break: break-word;
        line-height: 1.35;
      }
      .navigation-buttons {
      	display: flex;
      	justify-content: space-between;
      	padding: 0px 23px;
      	margin-top: -35px;
      	margin-bottom: 20px;
      	z-index: 1;
      	position: relative;
      }
      .nav-button {
        background: var(--card-inner-bg);
        border-radius: 50%;
        box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        width: 32px;
        height: 32px;
        display: flex;
        align-items: center;
        justify-content: center;
        border: none;
        cursor: pointer;
      }

      .nav-button ha-icon {
        color: var(--icon-color);
        --mdc-icon-size: 20px;
      }

      .nav-button:hover ha-icon {
        color: var(--icon-color);
      }

      .navigation-buttons .nav-button:hover {
        transform: scale(1.2);
      }

      .dieta-pagination {
        display: flex;
        justify-content: center;
        gap: 8px;
        margin: 12px 0 8px;
      }

      .dieta-pagination-dot {
        width: 8px;
        height: 8px;
        border-radius: 50%;
        background: #e5e7eb;
      }

      .dieta-pagination-dot.active {
        background: var(--icon-color);
        box-shadow: 0 0 6px var(--icon-color);
      }

      ha-icon[icon="mdi:coffee"]              { color: #f97316 !important; }
      ha-icon[icon="mdi:food-fork-drink"]     { color: #10b981 !important; }
      ha-icon[icon="mdi:moon-waning-crescent"]{ color: #6366f1 !important; }
      ha-icon[icon="mdi:cookie"]              { color: #ef4444 !important; }

      ha-card.default {
        background: var(--card-bg);
        --card-bg: #f9fafb;
        --card-inner-bg: #ffffff;
        --card-color: #111827;
        --header-bg: linear-gradient(135deg, #4f46e5, #9333ea);
        --header-text: white;
        --meal-title: #1f2937;
        --meal-desc: #374151;
        --icon-color: #6366f1;
        box-shadow: 0 8px 24px rgba(99,102,241,0.3);
      }

      ha-card.dark {
        background: var(--card-bg);
        --card-bg: #121212;
        --card-inner-bg: #1c1c1c;
        --card-color: #e0e0e0;
        --header-bg: linear-gradient(135deg, #ff5722, #9c27b0);
        --header-text: #ffffff;
        --meal-title: #f5f5f5;
        --meal-desc: #bdbdbd;
        --icon-color: #ff5722;
        box-shadow: 0 8px 24px rgba(255,87,34,0.4);
      }

      ha-card.pastel {
        background: var(--card-bg);
        --card-bg: #fff9f2;
        --card-inner-bg: #ffffff;
        --card-color: #3f3f46;
        --header-bg: linear-gradient(135deg, #ffafbd, #ffc3a0);
        --header-text: #4b5563;
        --meal-title: #4b5563;
        --meal-desc: #6b7280;
        --icon-color: #ff6584;
        box-shadow: 0 8px 24px rgba(255,175,189,0.3);
      }

      ha-card.neon {
      	background: var(--card-bg);
      	--card-bg: #080b19;
      	--card-inner-bg: #0e142b;
      	--card-color: #c0d6f9;
      	--header-bg: linear-gradient(135deg, #9700ff, #a020f0);
      	--header-text: #ffffff;
      	--meal-title: #c0d6f9;
      	--meal-desc: #8da2cb;
      	--icon-color: #00c3ff;
      	box-shadow: 0 0 10px rgba(0,229,255,0.7), 0 0 20px rgba(160,32,240,0.5);
      	animation: neonGlow 1.5s ease-in-out infinite alternate;
      }

      @keyframes neonGlow {
        from { box-shadow: 0 0 5px rgba(0,229,255,0.7), 0 0 10px rgba(160,32,240,0.5); }
        to { box-shadow: 0 0 10px rgba(0,229,255,1), 0 0 20px rgba(160,32,240,0.8); }
      }
      :host ::slotted(.card-content:not(:first-child)), slot:not(:first-child)::slotted(.card-content) {
      	padding-top: 0px;
      	margin-top: 0;
      }
    `;
  }
}

customElements.define('dieta-card', DietaCard);

window.customCards = window.customCards || [];
window.customCards.push({
  type: 'dieta-card',
  name: 'Dieta Card',
  description: 'Mostra e modifica la dieta settimanale'
});
