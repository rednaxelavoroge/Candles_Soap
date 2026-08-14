"use client";

import { useState } from "react";

/**
 * Заявка уходит в WhatsApp: бэкенда у прототипа нет, а форма, которая молча
 * ничего не отправляет, хуже её отсутствия. Собираем текст и открываем диалог
 * с уже подставленным сообщением — заказчице остаётся нажать «отправить».
 */
export function EnquiryForm({
  whatsappBase,
  siteName,
}: {
  whatsappBase: string;
  siteName: string;
}) {
  const [name, setName] = useState("");
  const [message, setMessage] = useState("");

  const onSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const text = [
      `Здравствуйте! Заявка с сайта ${siteName}.`,
      `Меня зовут: ${name.trim()}`,
      "",
      message.trim(),
    ].join("\n");

    window.open(`${whatsappBase}?text=${encodeURIComponent(text)}`, "_blank", "noopener");
  };

  return (
    <form onSubmit={onSubmit} className="max-w-lg">
      <label className="block">
        <span className="eyebrow">Как вас зовут</span>
        <input
          type="text"
          required
          value={name}
          onChange={(event) => setName(event.target.value)}
          autoComplete="name"
          className="mt-2 w-full border border-sand bg-surface px-4 py-3 text-sm outline-none focus:border-clay"
        />
      </label>

      <label className="mt-6 block">
        <span className="eyebrow">Что вас интересует</span>
        <textarea
          required
          rows={5}
          value={message}
          onChange={(event) => setMessage(event.target.value)}
          placeholder="Например: свеча в морской теме на подарок, нужно к 20 числу"
          className="mt-2 w-full resize-y border border-sand bg-surface px-4 py-3 text-sm outline-none focus:border-clay"
        />
      </label>

      <button
        type="submit"
        className="mt-7 inline-flex items-center justify-center border border-ink px-8 py-4 text-sm transition-colors duration-300 hover:bg-ink hover:text-surface"
      >
        Отправить в WhatsApp
      </button>

      <p className="mt-3 text-xs text-muted">
        Откроется WhatsApp с готовым сообщением — его останется только отправить.
      </p>
    </form>
  );
}
