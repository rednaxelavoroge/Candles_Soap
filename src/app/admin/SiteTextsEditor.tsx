"use client";

import { SITE_TEXTS, TEXT_GROUPS, type TextEntry } from "@/lib/site-texts";
import { useMemo, useState } from "react";

/**
 * Редактор всех текстов сайта по реестру src/lib/site-texts.ts.
 *
 * Поле показывает то, что стоит на сайте сейчас: либо исходный текст, либо
 * то, что заказчица уже переписала. Изменённые поля помечены, у каждого есть
 * кнопка вернуть исходный. Пустое поле — «не показывать»: элемент с сайта
 * исчезает, своё вместо него не подставляется.
 *
 * Поиск нужен потому, что полей много: заказчица видит фразу на сайте,
 * вписывает её кусок — и остаётся только это поле.
 */
export function SiteTextsEditor({
  value,
  onChange,
}: {
  /** Только изменённые тексты, как они лежат в site.json → texts. */
  value: Record<string, string>;
  onChange: (next: Record<string, string>) => void;
}) {
  const [query, setQuery] = useState("");
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({});

  const needle = query.trim().toLowerCase();

  const visible = useMemo(() => {
    if (!needle) return SITE_TEXTS;
    return SITE_TEXTS.filter((entry) => {
      const current = value[entry.key] ?? entry.default;
      return (
        entry.label.toLowerCase().includes(needle) ||
        current.toLowerCase().includes(needle) ||
        entry.default.toLowerCase().includes(needle) ||
        entry.group.toLowerCase().includes(needle)
      );
    });
  }, [needle, value]);

  const changedCount = Object.keys(value).filter((key) =>
    SITE_TEXTS.some((entry) => entry.key === key),
  ).length;

  const setText = (entry: TextEntry, text: string) => {
    const next = { ...value };
    if (text === entry.default) delete next[entry.key];
    else next[entry.key] = text;
    onChange(next);
  };

  const isOpen = (group: string) => (needle ? true : openGroups[group] ?? false);

  return (
    <div className="flex flex-col gap-4">
      <div className="rounded-2xl border border-sand/60 bg-bg/40 p-4">
        <p className="text-xs leading-relaxed text-muted">
          Здесь все надписи сайта: заголовки блоков, подписи над ними, кнопки, тексты
          в подвале, плашка в карточке изделия. Найдите нужную по слову, которое
          видите на сайте, впишите своё и нажмите «Сохранить все тексты» внизу.
          Если поле стереть до пустого, надпись с сайта исчезнет.
          {changedCount > 0 ? (
            <>
              {" "}
              Сейчас изменено: <strong className="text-ink">{changedCount}</strong>.
            </>
          ) : null}
        </p>
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Найти надпись: например, «повторю» или «срок изготовления»"
          className="mt-3 w-full rounded-xl border border-sand bg-surface px-4 py-2.5 text-xs text-ink placeholder:text-muted/60 focus:border-btn-brown focus:outline-none"
        />
      </div>

      {TEXT_GROUPS.map((group) => {
        const entries = visible.filter((entry) => entry.group === group);
        if (entries.length === 0) return null;
        const changedHere = entries.filter((entry) => entry.key in value).length;
        const open = isOpen(group);

        return (
          <section key={group} className="rounded-2xl border border-sand/60 bg-surface shadow-sm">
            <button
              type="button"
              onClick={() => setOpenGroups((prev) => ({ ...prev, [group]: !open }))}
              aria-expanded={open}
              className="flex w-full items-center justify-between gap-3 px-5 py-3.5 text-left"
            >
              <span className="font-display text-base text-ink">{group}</span>
              <span className="flex items-center gap-2 text-[0.7rem] text-muted">
                {changedHere > 0 ? (
                  <span className="rounded-full bg-btn-brown/15 px-2 py-0.5 font-semibold text-btn-brown">
                    изменено {changedHere}
                  </span>
                ) : null}
                <span>{entries.length} полей</span>
                <span aria-hidden="true">{open ? "▴" : "▾"}</span>
              </span>
            </button>

            {open ? (
              <div className="flex flex-col gap-4 border-t border-sand/60 px-5 py-4">
                {entries.map((entry) => {
                  const changed = entry.key in value;
                  const current = changed ? value[entry.key] : entry.default;
                  const fieldClass =
                    "w-full rounded-xl border bg-bg/50 px-4 py-2.5 text-xs text-ink focus:border-btn-brown focus:outline-none " +
                    (changed ? "border-btn-brown/60" : "border-sand");

                  return (
                    <div key={entry.key}>
                      <div className="mb-1 flex flex-wrap items-center justify-between gap-2">
                        <label
                          htmlFor={`text-${entry.key}`}
                          className="text-xs font-semibold uppercase tracking-wider text-muted"
                        >
                          {entry.label}
                        </label>
                        {changed ? (
                          <button
                            type="button"
                            onClick={() => setText(entry, entry.default)}
                            className="text-[0.7rem] font-medium text-btn-brown hover:underline"
                          >
                            Вернуть исходный
                          </button>
                        ) : null}
                      </div>
                      {entry.multiline ? (
                        <textarea
                          id={`text-${entry.key}`}
                          rows={3}
                          value={current}
                          onChange={(e) => setText(entry, e.target.value)}
                          className={fieldClass}
                        />
                      ) : (
                        <input
                          id={`text-${entry.key}`}
                          type="text"
                          value={current}
                          onChange={(e) => setText(entry, e.target.value)}
                          className={fieldClass}
                        />
                      )}
                      {entry.hint ? (
                        <p className="mt-1 text-[0.7rem] leading-relaxed text-muted">{entry.hint}</p>
                      ) : null}
                      {changed && current === "" ? (
                        <p className="mt-1 text-[0.7rem] text-btn-brown">
                          Поле пустое — на сайте этой надписи не будет.
                        </p>
                      ) : null}
                      {changed && current !== "" ? (
                        <p className="mt-1 text-[0.7rem] text-muted">
                          Было: <span className="italic">{entry.default}</span>
                        </p>
                      ) : null}
                    </div>
                  );
                })}
              </div>
            ) : null}
          </section>
        );
      })}

      {visible.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-sand p-6 text-xs text-muted">
          Ничего не нашлось. Попробуйте другое слово — например, одно слово из надписи,
          а не всю фразу.
        </p>
      ) : null}
    </div>
  );
}
