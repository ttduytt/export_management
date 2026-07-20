class DateRangePicker {
  constructor({ inputId, onChange }) {
    this.inputEl = document.getElementById(inputId);
    this.onChange = onChange;

    // State
    this.from = null;
    this.to = null;
    this.hovered = null;
    this.selecting = false; // false = chọn from, true = chọn to
    this.viewYear = dayjs().year();
    this.viewMonth = dayjs().month(); // 0-11

    // Default: hôm nay → hôm nay
    const today = dayjs().format("YYYY-MM-DD");
    this._setRange(today, today, false);

    this._buildDOM();
    this._bindInput();
  }

  // ── DOM ────────────────────────────────────────────────────────────────
  _buildDOM() {
    // Wrapper bao input + dropdown
    const wrapper = document.createElement("div");
    wrapper.className = "drp-wrap";
    this.inputEl.parentNode.insertBefore(wrapper, this.inputEl);
    wrapper.appendChild(this.inputEl);

    // Dropdown
    const dropdown = document.createElement("div");
    dropdown.className = "drp-dropdown";
    dropdown.innerHTML = this._dropdownHTML();
    wrapper.appendChild(dropdown);
    this.dropdown = dropdown;
    this.wrapper = wrapper;

    this._renderCalendar();
    this._bindDropdown();
  }

  _dropdownHTML() {
    return `
      <div class="drp-header">
        <button class="drp-nav drp-prev" type="button">&#8249;</button>
        <span class="drp-month-label"></span>
        <button class="drp-nav drp-next" type="button">&#8250;</button>
      </div>
      <div class="drp-weekdays">
        <span>Mo</span><span>Tu</span><span>We</span>
        <span>Th</span><span>Fr</span><span>Sa</span><span>Su</span>
      </div>
      <div class="drp-days"></div>
      <div class="drp-footer">
        <span class="drp-hint"></span>
      </div>
    `;
  }

  _renderCalendar() {
    const ym = dayjs(new Date(this.viewYear, this.viewMonth, 1));
    this.dropdown.querySelector(".drp-month-label").textContent =
      ym.format("MMMM YYYY");

    const daysEl = this.dropdown.querySelector(".drp-days");
    daysEl.innerHTML = "";

    // Offset: Monday-based (0=Mo … 6=Su)
    const firstDay = ym.day(); // 0=Sun
    const offset = firstDay === 0 ? 6 : firstDay - 1;

    for (let i = 0; i < offset; i++) {
      const blank = document.createElement("span");
      blank.className = "drp-day drp-empty";
      daysEl.appendChild(blank);
    }

    const daysInMonth = ym.daysInMonth();
    const today = dayjs().format("YYYY-MM-DD");

    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = dayjs(new Date(this.viewYear, this.viewMonth, d)).format(
        "YYYY-MM-DD",
      );
      const span = document.createElement("span");
      span.className = "drp-day";
      span.dataset.date = dateStr;
      span.textContent = d;

      if (dateStr === today) span.classList.add("drp-today");
      this._applyDayClasses(span, dateStr);

      span.addEventListener("click", () => this._onDayClick(dateStr));
      span.addEventListener("mouseenter", () => this._onDayHover(dateStr));
      daysEl.appendChild(span);
    }

    // Hint
    const hint = this.dropdown.querySelector(".drp-hint");
    if (!this.selecting) {
      hint.textContent = "Chọn ngày bắt đầu";
    } else {
      hint.textContent = `Từ ${this.from} — chọn ngày kết thúc`;
    }
  }

  _applyDayClasses(span, dateStr) {
    span.classList.remove(
      "drp-selected-start",
      "drp-selected-end",
      "drp-in-range",
      "drp-hover-range",
    );

    const from = this.from;
    const to = this.selecting ? this.hovered || this.from : this.to;

    const lo = from && to ? (from <= to ? from : to) : from;
    const hi = from && to ? (from <= to ? to : from) : from;

    if (dateStr === lo && dateStr === hi) {
      span.classList.add("drp-selected-start", "drp-selected-end");
    } else if (dateStr === lo) {
      span.classList.add("drp-selected-start");
    } else if (dateStr === hi) {
      span.classList.add("drp-selected-end");
    } else if (lo && hi && dateStr > lo && dateStr < hi) {
      span.classList.add(this.selecting ? "drp-hover-range" : "drp-in-range");
    }
  }

  _refreshDays() {
    this.dropdown.querySelectorAll(".drp-day[data-date]").forEach((span) => {
      this._applyDayClasses(span, span.dataset.date);
    });

    const hint = this.dropdown.querySelector(".drp-hint");
    if (!this.selecting) {
      hint.textContent = "Chọn ngày bắt đầu";
    } else {
      hint.textContent = `Từ ${this.from} — chọn ngày kết thúc`;
    }
  }

  // ── Events ─────────────────────────────────────────────────────────────
  _bindInput() {
    this.inputEl.addEventListener("click", (e) => {
      e.stopPropagation();
      this._open();
    });
  }

  _bindDropdown() {
    this.dropdown.querySelector(".drp-prev").addEventListener("click", (e) => {
      e.stopPropagation();
      if (this.viewMonth === 0) {
        this.viewMonth = 11;
        this.viewYear--;
      } else this.viewMonth--;
      this._renderCalendar();
    });

    this.dropdown.querySelector(".drp-next").addEventListener("click", (e) => {
      e.stopPropagation();
      if (this.viewMonth === 11) {
        this.viewMonth = 0;
        this.viewYear++;
      } else this.viewMonth++;
      this._renderCalendar();
    });

    this.dropdown.addEventListener("mouseleave", () => {
      this.hovered = null;
      this._refreshDays();
    });

    document.addEventListener("click", (e) => {
      if (!this.wrapper.contains(e.target)) this._close();
    });
  }

  _onDayClick(dateStr) {
    if (!this.selecting) {
      // Chọn FROM
      this.from = dateStr;
      this.to = null;
      this.selecting = true;
      this._refreshDays();
    } else {
      // Chọn TO
      let from = this.from,
        to = dateStr;
      if (to < from) {
        [from, to] = [to, from];
      }
      this._setRange(from, to, true);
      this.selecting = false;
      this._close();
    }
  }

  _onDayHover(dateStr) {
    if (this.selecting) {
      this.hovered = dateStr;
      this._refreshDays();
    }
  }

  // ── Open/Close ─────────────────────────────────────────────────────────
  _open() {
    // Reset về đầu tháng của `from` khi mở
    if (this.from) {
      const d = dayjs(this.from);
      this.viewYear = d.year();
      this.viewMonth = d.month();
    }
    this.selecting = false;
    this._renderCalendar();
    this.dropdown.classList.add("drp-open");
  }

  _close() {
    this.dropdown.classList.remove("drp-open");
    this.selecting = false;
    this.hovered = null;
  }

  // ── Range ──────────────────────────────────────────────────────────────
  _setRange(from, to, fireCallback) {
    this.from = from;
    this.to = to;
    this.inputEl.value = from === to ? from : `${from} ~ ${to}`;
    if (fireCallback) this.onChange?.(from, to);
  }

  // ── Public API ─────────────────────────────────────────────────────────
  clear() {
    const today = dayjs().format("YYYY-MM-DD");
    this._setRange(today, today, true);
    this.selecting = false;
    this.hovered = null;
  }

  getFrom() {
    return this.from;
  }
  getTo() {
    return this.to;
  }
}

// ── CSS injected ───────────────────────────────────────────────────────────
(function injectStyles() {
  if (document.getElementById("drp-styles")) return;
  const style = document.createElement("style");
  style.id = "drp-styles";
  style.textContent = `
.drp-wrap {
  position: relative;
  display: inline-block;
}

.drp-dropdown {
  display: none;
  position: absolute;
  top: calc(100% + 6px);
  left: 0;
  z-index: 9999;
  width: 280px;
  background: #111827;
  border: 1px solid #2a3a6a;
  border-radius: 12px;
  box-shadow: 0 8px 32px rgba(0,0,0,0.55);
  padding: 12px;
  user-select: none;
}

.drp-dropdown.drp-open { display: block; }

/* Header nav */
.drp-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 10px;
}

.drp-month-label {
  font-size: 13px;
  font-weight: 700;
  color: #e2e8f0;
  letter-spacing: 0.02em;
}

.drp-nav {
  background: none;
  border: none;
  color: #7a8fcc;
  font-size: 22px;
  cursor: pointer;
  padding: 0 6px;
  line-height: 1;
  border-radius: 6px;
  transition: color 0.15s, background 0.15s;
}
.drp-nav:hover { color: #fff; background: rgba(255,255,255,0.08); }

/* Weekday labels */
.drp-weekdays {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  margin-bottom: 4px;
}
.drp-weekdays span {
  text-align: center;
  font-size: 10px;
  font-weight: 700;
  color: #4a5e9a;
  text-transform: uppercase;
  padding: 3px 0;
}

/* Day grid */
.drp-days {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 1px;
}

.drp-day {
  text-align: center;
  font-size: 12px;
  color: #cbd5e1;
  cursor: pointer;
  padding: 6px 2px;
  border-radius: 6px;
  transition: background 0.1s, color 0.1s;
  position: relative;
}

.drp-day:not(.drp-empty):hover {
  background: rgba(99, 130, 246, 0.25);
  color: #fff;
}

.drp-empty { cursor: default; }

/* Today */
.drp-today { color: #60a5fa; font-weight: 700; }

/* Selected endpoints */
.drp-selected-start,
.drp-selected-end {
  background: #2563eb !important;
  color: #fff !important;
  font-weight: 700;
  border-radius: 6px;
}

/* Both start and end on same day */
.drp-selected-start.drp-selected-end {
  border-radius: 6px;
}

/* In-range (confirmed) */
.drp-in-range {
  background: rgba(37, 99, 235, 0.2);
  color: #93c5fd;
  border-radius: 0;
}

/* Hover range preview (before to is picked) */
.drp-hover-range {
  background: rgba(37, 99, 235, 0.12);
  color: #bfdbfe;
  border-radius: 0;
}

/* Round edges of range */
.drp-selected-start:not(.drp-selected-end) { border-radius: 6px 0 0 6px; }
.drp-selected-end:not(.drp-selected-start) { border-radius: 0 6px 6px 0; }

/* Footer hint */
.drp-footer {
  margin-top: 10px;
  border-top: 1px solid #1e2a50;
  padding-top: 8px;
}
.drp-hint {
  font-size: 11px;
  color: #4a5e9a;
  display: block;
  text-align: center;
}

/* Light theme overrides */
body.light-theme .drp-dropdown {
  background: #fff;
  border-color: #d1d5db;
  box-shadow: 0 8px 32px rgba(0,0,0,0.12);
}
body.light-theme .drp-month-label { color: #1f2937; }
body.light-theme .drp-nav { color: #6b7280; }
body.light-theme .drp-nav:hover { color: #111827; background: rgba(0,0,0,0.06); }
body.light-theme .drp-weekdays span { color: #9ca3af; }
body.light-theme .drp-day { color: #374151; }
body.light-theme .drp-day:not(.drp-empty):hover { background: rgba(37,99,235,0.1); color: #1f2937; }
body.light-theme .drp-today { color: #2563eb; }
body.light-theme .drp-in-range { background: rgba(37,99,235,0.1); color: #1d4ed8; }
body.light-theme .drp-hover-range { background: rgba(37,99,235,0.06); color: #3b82f6; }
body.light-theme .drp-footer { border-top-color: #e5e7eb; }
body.light-theme .drp-hint { color: #9ca3af; }
  `;
  document.head.appendChild(style);
})();

export default DateRangePicker;
