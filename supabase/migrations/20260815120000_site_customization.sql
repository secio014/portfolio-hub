-- Site-wide customization: accent colors, fonts, browser tab title/icon.
-- All nullable — a null value means "use the built-in default".
alter table public.site_settings
  add column if not exists theme_accent_light text,
  add column if not exists theme_accent_dark text,
  add column if not exists font_sans text,
  add column if not exists font_mono text,
  add column if not exists site_title text,
  add column if not exists favicon_url text;
