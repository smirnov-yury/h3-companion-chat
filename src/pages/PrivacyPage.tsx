import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import TopAppBar from "@/components/TopAppBar";
import NavDrawer from "@/components/NavDrawer";
import SEOMeta from "@/components/SEOMeta";
import Footer from "@/components/Footer";
import { useLang } from "@/context/LanguageContext";
import { findSectionByTabId, type SectionDef } from "@/config/sectionRegistry";
import type { TabId } from "@/components/NavDrawer";

function Ext({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="text-primary hover:underline"
    >
      {children}
    </a>
  );
}

function Mailto({ addr }: { addr: string }) {
  return (
    <a href={`mailto:${addr}`} className="text-primary hover:underline">
      {addr}
    </a>
  );
}

export default function PrivacyPage() {
  const { lang } = useLang();
  const navigate = useNavigate();
  const isRu = lang === "RU";
  const [drawerOpen, setDrawerOpen] = useState(false);

  const handleTabChange = (newTab: TabId) => {
    const def: SectionDef | undefined = findSectionByTabId(newTab);
    if (def) navigate(`/${def.slug}`);
  };

  return (
    <div className="flex flex-col h-dvh">
      <SEOMeta routeKey="privacy" />
      <TopAppBar
        title={isRu ? "Политика конфиденциальности" : "Privacy Policy"}
        onMenuClick={() => setDrawerOpen(true)}
      />
      <NavDrawer
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        active={"" as TabId}
        onChange={handleTabChange}
      />
      <main className="flex-1 overflow-y-auto pt-11 lg:ml-56">
        <div className="max-w-3xl mx-auto px-4 py-8 space-y-8">
          <Link
            to="/"
            className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-primary transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            {isRu ? "Назад" : "Back"}
          </Link>

          <header className="space-y-2">
            <h1 className="text-3xl font-bold tracking-tight">
              {isRu ? "Политика конфиденциальности" : "Privacy Policy"}
            </h1>
            <p className="text-sm text-muted-foreground">
              {isRu ? "Последнее обновление: 15 мая 2026" : "Last updated: 15 May 2026"}
            </p>
          </header>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold">
              {isRu ? "1. Введение" : "1. Introduction"}
            </h2>
            <p className="text-sm leading-relaxed text-foreground/90">
              {isRu
                ? "Настоящая Политика конфиденциальности описывает, как H3 Master («мы», «наш», «Сервис») собирает, использует и защищает информацию при использовании приложения по адресу h3master.app. Сервис — неофициальное фанатское приложение-компаньон для настольной игры «Герои Меча и Магии III». Мы обязуемся обрабатывать персональные данные в соответствии с Общим регламентом по защите данных Европейского Союза (GDPR) и применимым законодательством Латвийской Республики."
                : 'This Privacy Policy describes how H3 Master ("we", "our", the "Service") collects, uses, and protects information when you use the application at h3master.app. The Service is an unofficial fan-made companion for Heroes of Might & Magic III: The Board Game. We are committed to processing personal data in compliance with the EU General Data Protection Regulation (GDPR) and applicable Latvian law.'}
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold">
              {isRu ? "2. Какие данные мы собираем" : "2. Data we collect"}
            </h2>
            <p className="text-sm leading-relaxed text-foreground/90">
              {isRu
                ? "Мы собираем минимально необходимые данные для работы Сервиса. Регистрация аккаунта не требуется; мы не собираем имена, адреса электронной почты или платёжную информацию."
                : "We collect the minimum data necessary to operate the Service. We do not require account registration, and we do not collect names, email addresses, or payment information."}
            </p>
            <ul className="list-disc pl-6 space-y-2 text-sm leading-relaxed text-foreground/90">
              {isRu ? (
                <>
                  <li><strong>Хэшированный IP-адрес (ip_hash):</strong> Односторонний SHA-256-хэш вашего IP-адреса в сочетании с серверной солью. Используется исключительно для ограничения скорости запросов и предотвращения злоупотреблений. Исходный IP-адрес не сохраняется.</li>
                  <li><strong>Запросы к ИИ Мастеру игры:</strong> При использовании чата с ИИ мы сохраняем текст вашего вопроса, выбранный язык, модель ИИ, первые 400 символов ответа (response_excerpt), количество токенов, время ответа и флаг успешности ответа (is_dont_know). Эти данные используются для контроля качества сервиса, выявления сбоев поиска и улучшения базы знаний.</li>
                  <li><strong>Голосовые записи:</strong> При использовании голосового ввода аудио передаётся напрямую в OpenAI Whisper для распознавания. Сам аудиофайл не сохраняется. Мы фиксируем только длительность записи в секундах (audio_duration_sec) для контроля расходов.</li>
                  <li><strong>Снимки подготовки партии:</strong> При генерации конфигурации партии мы сохраняем параметры (фракции, сценарий, число игроков) анонимно вместе с хэшированным IP для ограничения частоты. Эти снимки автоматически удаляются через 24 часа.</li>
                  <li><strong>Технические журналы:</strong> Стандартные журналы веб-сервера (пути запросов, HTTP-коды состояния, user-agent, временные метки) хранятся 14 дней для целей безопасности и отладки. В этих журналах нет содержимого запросов.</li>
                </>
              ) : (
                <>
                  <li><strong>Hashed IP address (ip_hash):</strong> A one-way SHA-256 hash of your IP address combined with a server-side salt. Used solely for rate limiting and abuse prevention. The original IP is never stored.</li>
                  <li><strong>AI Game Master queries:</strong> When you use the AI chat feature, we log the text of your question, the language used, the AI model selected, the first 400 characters of the AI response (response_excerpt), token counts, response latency, and whether the AI was able to answer (is_dont_know flag). This data is used to monitor service quality, detect retrieval failures, and improve the underlying knowledge base.</li>
                  <li><strong>Voice recordings:</strong> When you use voice input, audio is streamed directly to OpenAI Whisper for transcription. We do not store the audio file. We log only the duration of the recording in seconds (audio_duration_sec) for cost monitoring.</li>
                  <li><strong>Game Setup snapshots:</strong> When you generate a game configuration, we store the parameters (factions, scenario, player count) anonymously with your hashed IP for rate limiting. These snapshots are automatically deleted after 24 hours.</li>
                  <li><strong>Technical logs:</strong> Standard web server access logs (request paths, HTTP status codes, user agent strings, timestamps) are retained for 14 days for security and debugging purposes. These logs do not contain query content.</li>
                </>
              )}
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold">
              {isRu ? "3. Cookie и локальное хранилище" : "3. Cookies and local storage"}
            </h2>
            <p className="text-sm leading-relaxed text-foreground/90">
              {isRu
                ? "Мы используем следующие механизмы хранения данных на стороне клиента:"
                : "We use the following client-side storage mechanisms:"}
            </p>
            <ul className="list-disc pl-6 space-y-2 text-sm leading-relaxed text-foreground/90">
              {isRu ? (
                <>
                  <li><strong>Кэш Service Worker (необходимо):</strong> Прогрессивное веб-приложение кэширует файлы для офлайн-работы. Никакие пользовательские данные никуда не отправляются. Требуется для офлайн-функциональности Сервиса.</li>
                  <li><strong>История чата (необходимо, опционально):</strong> При использовании ИИ-чата недавняя беседа сохраняется в localStorage браузера под ключом <code>chat_persistence_v1</code> сроком до 24 часов, чтобы вы могли продолжить с того же места после обновления страницы. Вы можете очистить историю в любое время через кнопку корзины в интерфейсе чата.</li>
                  <li><strong>Предпочтения языка:</strong> Выбранный язык (EN/RU) сохраняется в localStorage, чтобы мы могли восстановить его при следующем визите.</li>
                  <li><strong>Согласие на cookie (необходимо):</strong> Ваш выбор согласия сохраняется в localStorage под ключом <code>consent_v1</code>, чтобы не запрашивать подтверждение при каждом визите.</li>
                  <li><strong>Google Analytics (требует согласия):</strong> Если вы дадите согласие на аналитику, Google Analytics 4 (GA4) установит first-party cookie (<code>_ga</code>, <code>_ga_*</code>) для измерения трафика. Эти cookie НЕ устанавливаются до явного согласия. Мы используем Google Consent Mode v2 с настройкой <code>analytics_storage: 'denied'</code> по умолчанию. Анонимизация IP-адресов включена. См. раздел 5 о Google как стороннем обработчике.</li>
                </>
              ) : (
                <>
                  <li><strong>Service Worker cache (essential):</strong> A Progressive Web App cache that stores application files for offline use. No user data is sent anywhere. Required for the Service to function offline.</li>
                  <li><strong>Chat history (essential, optional):</strong> When the AI chat is used, the recent conversation is stored in your browser's localStorage under the key <code>chat_persistence_v1</code> for up to 24 hours so you can continue where you left off after refresh. You can clear this at any time via the chat interface trash button.</li>
                  <li><strong>Language preference:</strong> Your selected language (EN/RU) is stored in localStorage so we can restore it on next visit.</li>
                  <li><strong>Cookie consent (essential):</strong> Your consent choices are stored in localStorage under the key <code>consent_v1</code> so we do not re-prompt you on every visit.</li>
                  <li><strong>Google Analytics (consent-required):</strong> If you grant analytics consent, Google Analytics 4 (GA4) sets first-party cookies (<code>_ga</code>, <code>_ga_*</code>) for traffic measurement. These cookies are NOT set until you explicitly accept analytics. We use Google Consent Mode v2 with <code>analytics_storage: 'denied'</code> as the default. IP anonymization is enabled in our GA4 property. See Section 5 for details on Google as a third-party processor.</li>
                </>
              )}
            </ul>
            <p className="text-sm leading-relaxed text-foreground/90">
              {isRu
                ? "Мы НЕ используем рекламные cookie, отслеживающие пиксели или средства отслеживания социальных сетей. Сервис не встраивает виджеты сторонних сервисов, устанавливающих cookie."
                : "We do NOT use any advertising cookies, tracking pixels, or social media tracking. The Service does not embed third-party widgets that set cookies."}
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold">
              {isRu ? "4. Правовые основания обработки" : "4. Legal basis for processing"}
            </h2>
            {isRu ? (
              <div className="text-sm leading-relaxed text-foreground/90 space-y-2">
                <p>Мы обрабатываем данные на следующих правовых основаниях (статья 6 GDPR):</p>
                <ul className="list-disc pl-6 space-y-2">
                  <li><strong>Законный интерес (статья 6(1)(f)):</strong> Работа Сервиса, ограничение частоты запросов, предотвращение злоупотреблений, мониторинг безопасности и улучшение базы знаний ИИ. Мы считаем, что эти интересы не превалируют над вашими основными правами, учитывая минимальный объём данных и применённую псевдонимизацию.</li>
                  <li><strong>Согласие (статья 6(1)(a)):</strong> Отслеживание Google Analytics. Вы можете дать, отказать или отозвать согласие в любое время через баннер настроек cookie.</li>
                  <li><strong>Исполнение услуги (статья 6(1)(b)):</strong> Обработка запросов к ИИ и распознавание голоса при активном использовании этих функций.</li>
                </ul>
              </div>
            ) : (
              <div className="text-sm leading-relaxed text-foreground/90 space-y-2">
                <p>We process data under the following legal bases (GDPR Article 6):</p>
                <ul className="list-disc pl-6 space-y-2">
                  <li><strong>Legitimate interest (Article 6(1)(f)):</strong> Operating the Service, rate limiting, abuse prevention, security monitoring, and improving the AI knowledge base. We believe these interests do not override your fundamental rights, given the minimal data scope and pseudonymisation applied.</li>
                  <li><strong>Consent (Article 6(1)(a)):</strong> Google Analytics tracking. You can grant, refuse, or withdraw consent at any time via the cookie preferences banner.</li>
                  <li><strong>Performance of a service (Article 6(1)(b)):</strong> Processing AI queries and voice transcriptions when you actively use those features.</li>
                </ul>
              </div>
            )}
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold">
              {isRu ? "5. Сторонние обработчики" : "5. Third-party processors"}
            </h2>
            <p className="text-sm leading-relaxed text-foreground/90">
              {isRu
                ? "Мы используем следующих поставщиков услуг для работы Сервиса. С каждым заключено Соглашение об обработке данных (DPA) или эквивалентные условия:"
                : "We use the following service providers to operate the Service. Each is bound by a Data Processing Agreement (DPA) or equivalent terms:"}
            </p>
            <ul className="list-disc pl-6 space-y-2 text-sm leading-relaxed text-foreground/90">
              {isRu ? (
                <>
                  <li><strong>Supabase (база данных, хранилище, edge-функции):</strong> Размещение в ЕС (Франкфурт, Германия). Хранит все данные приложения, включая ai_chat_logs. <Ext href="https://supabase.com/privacy">supabase.com/privacy</Ext></li>
                  <li><strong>OpenAI (модели ИИ):</strong> Используется для gpt-4o (чат), whisper-1 (распознавание речи) и text-embedding-3-small (семантический поиск). Данные, передаваемые через API OpenAI, не используются для обучения их моделей согласно политике использования API. Серверы в США. Участник Рамочной программы конфиденциальности данных ЕС-США. <Ext href="https://openai.com/policies/privacy-policy">openai.com/policies/privacy-policy</Ext></li>
                  <li><strong>Hetzner Online GmbH (VPS-хостинг):</strong> Сервер приложения размещён в Нюрнберге, Германия. Подпадает под немецкий федеральный закон о защите данных и GDPR. <Ext href="https://www.hetzner.com/legal/privacy-policy">hetzner.com/legal/privacy-policy</Ext></li>
                  <li><strong>Cloudflare (CDN, DNS, защита от DDoS, маршрутизация почты):</strong> Глобальная edge-сеть. Участник Рамочной программы конфиденциальности данных ЕС-США. Обрабатывает метаданные подключений для безопасности и производительности. <Ext href="https://www.cloudflare.com/privacypolicy">cloudflare.com/privacypolicy</Ext></li>
                  <li><strong>Google LLC (Google Analytics 4 — требует согласия):</strong> Загружается только после получения вашего согласия на аналитику. Настроен с анонимизацией IP-адресов. Участник Рамочной программы конфиденциальности данных ЕС-США. <Ext href="https://policies.google.com/privacy">policies.google.com/privacy</Ext></li>
                </>
              ) : (
                <>
                  <li><strong>Supabase (database, storage, edge functions):</strong> Hosted in the EU (Frankfurt, Germany). Stores all application data including ai_chat_logs. <Ext href="https://supabase.com/privacy">supabase.com/privacy</Ext></li>
                  <li><strong>OpenAI (AI models):</strong> Used for gpt-4o (chat), whisper-1 (voice transcription), and text-embedding-3-small (semantic search). Data transferred to OpenAI under the API is not used to train their models per OpenAI's API Data Usage Policy. Servers in the United States. EU-US Data Privacy Framework participant. <Ext href="https://openai.com/policies/privacy-policy">openai.com/policies/privacy-policy</Ext></li>
                  <li><strong>Hetzner Online GmbH (VPS hosting):</strong> The application server is hosted in Nürnberg, Germany. Subject to German federal data protection law and GDPR. <Ext href="https://www.hetzner.com/legal/privacy-policy">hetzner.com/legal/privacy-policy</Ext></li>
                  <li><strong>Cloudflare (CDN, DNS, DDoS protection, email routing):</strong> Global edge network. EU-US Data Privacy Framework participant. Processes connection metadata for security and performance. <Ext href="https://www.cloudflare.com/privacypolicy">cloudflare.com/privacypolicy</Ext></li>
                  <li><strong>Google LLC (Google Analytics 4 — consent-required):</strong> Only loaded after you grant analytics consent. Configured with IP anonymization. EU-US Data Privacy Framework participant. <Ext href="https://policies.google.com/privacy">policies.google.com/privacy</Ext></li>
                </>
              )}
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold">
              {isRu ? "6. Сроки хранения данных" : "6. Data retention"}
            </h2>
            <ul className="list-disc pl-6 space-y-2 text-sm leading-relaxed text-foreground/90">
              {isRu ? (
                <>
                  <li><strong>Журналы чата ИИ (ai_chat_logs):</strong> 90 дней, затем автоматически удаляются плановой задачей базы данных.</li>
                  <li><strong>Снимки подготовки партии (game_sessions):</strong> 24 часа, затем автоматически удаляются.</li>
                  <li><strong>Журналы доступа веб-сервера:</strong> 14 дней.</li>
                  <li><strong>Данные localStorage на вашем устройстве:</strong> до момента очистки данных браузера или удаления приложения.</li>
                  <li><strong>Резервные копии:</strong> Резервные копии базы данных хранятся 7 дней с шифрованием на стороне хранилища.</li>
                </>
              ) : (
                <>
                  <li><strong>AI chat logs (ai_chat_logs):</strong> 90 days, then automatically deleted by a scheduled database job.</li>
                  <li><strong>Game Setup snapshots (game_sessions):</strong> 24 hours, then automatically deleted.</li>
                  <li><strong>Web server access logs:</strong> 14 days.</li>
                  <li><strong>localStorage data on your device:</strong> until you clear browser data or uninstall the application.</li>
                  <li><strong>Backups:</strong> Database backups are retained for 7 days and are encrypted at rest.</li>
                </>
              )}
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold">
              {isRu ? "7. Ваши права согласно GDPR" : "7. Your rights under GDPR"}
            </h2>
            <p className="text-sm leading-relaxed text-foreground/90">
              {isRu
                ? "Если вы находитесь в Европейской экономической зоне, у вас есть следующие права согласно GDPR:"
                : "If you are located in the European Economic Area, you have the following rights under GDPR:"}
            </p>
            <ul className="list-disc pl-6 space-y-2 text-sm leading-relaxed text-foreground/90">
              {isRu ? (
                <>
                  <li><strong>Право доступа (статья 15):</strong> Запросить копию всех персональных данных, которые мы храним о вас.</li>
                  <li><strong>Право на удаление («право быть забытым», статья 17):</strong> Запросить удаление ваших данных. Поскольку единственным идентификатором у нас является псевдонимизированный ip_hash, для поиска ваших записей может потребоваться дополнительный контекст (примерные временные метки, тексты запросов).</li>
                  <li><strong>Право на переносимость данных (статья 20):</strong> Получить ваши данные в машиночитаемом формате.</li>
                  <li><strong>Право на возражение (статья 21):</strong> Возразить против обработки на основании законного интереса. Мы прекратим обработку, если не сможем продемонстрировать веские законные основания.</li>
                  <li><strong>Право отозвать согласие:</strong> Отозвать согласие на аналитику в любое время через баннер настроек cookie. Отзыв не влияет на законность обработки до момента отзыва.</li>
                  <li><strong>Право подать жалобу:</strong> В Государственную инспекцию данных Латвии (<Ext href="https://www.dvi.gov.lv">dvi.gov.lv</Ext>) или в надзорный орган по вашему месту жительства.</li>
                </>
              ) : (
                <>
                  <li><strong>Right of access (Article 15):</strong> Request a copy of any personal data we hold about you.</li>
                  <li><strong>Right to erasure ("right to be forgotten", Article 17):</strong> Request deletion of your data. Note that because we use pseudonymised ip_hash as the only identifier, you may need to provide context (approximate timestamps, queries) to help us locate your records.</li>
                  <li><strong>Right to data portability (Article 20):</strong> Request your data in a machine-readable format.</li>
                  <li><strong>Right to object (Article 21):</strong> Object to processing based on legitimate interest. We will stop processing unless we can demonstrate compelling legitimate grounds.</li>
                  <li><strong>Right to withdraw consent:</strong> Withdraw analytics consent at any time via the cookie preferences banner. Withdrawal does not affect lawfulness of processing before withdrawal.</li>
                  <li><strong>Right to lodge a complaint:</strong> With the Latvian Data State Inspectorate (<Ext href="https://www.dvi.gov.lv">dvi.gov.lv</Ext>) or your local supervisory authority.</li>
                </>
              )}
            </ul>
            <p className="text-sm leading-relaxed text-foreground/90">
              {isRu ? (
                <>Для реализации любого из этих прав свяжитесь с нами по адресу <Mailto addr="privacy@h3master.app" />. Мы ответим в течение 30 дней, как того требует статья 12 GDPR.</>
              ) : (
                <>To exercise any of these rights, contact us at <Mailto addr="privacy@h3master.app" />. We will respond within 30 days as required by GDPR Article 12.</>
              )}
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold">
              {isRu ? "8. Конфиденциальность детей" : "8. Children's privacy"}
            </h2>
            <p className="text-sm leading-relaxed text-foreground/90">
              {isRu
                ? "Сервис предназначен для пользователей в возрасте от 16 лет и старше. Мы сознательно не собираем данные от детей младше 16 лет. Настольная игра, для которой создан компаньон, имеет рекомендованный издателем возраст 14+. Если вы считаете, что Сервисом воспользовался ребёнок, и хотите запросить удаление данных, свяжитесь с нами по адресу privacy@h3master.app."
                : "The Service is intended for users aged 16 and older. We do not knowingly collect data from children under 16. The board game itself carries a publisher-recommended age of 14+. If you believe a child has used the Service and you wish to request data deletion, contact us at privacy@h3master.app."}
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold">
              {isRu ? "9. Международная передача данных" : "9. International data transfers"}
            </h2>
            <p className="text-sm leading-relaxed text-foreground/90">
              {isRu
                ? "Некоторые из наших обработчиков (OpenAI, Google Analytics, Cloudflare) имеют головной офис в США. Передача персональных данных в США осуществляется в рамках Рамочной программы конфиденциальности данных ЕС-США или эквивалентных Стандартных договорных условий, одобренных Европейской комиссией. Мы минимизируем объём передаваемых данных везде, где это технически возможно."
                : "Some of our processors (OpenAI, Google Analytics, Cloudflare) are headquartered in the United States. Transfers of personal data to the US are made under the EU-US Data Privacy Framework or equivalent Standard Contractual Clauses approved by the European Commission. We minimise transferred data wherever technically feasible."}
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold">
              {isRu ? "10. Безопасность" : "10. Security"}
            </h2>
            <p className="text-sm leading-relaxed text-foreground/90">
              {isRu
                ? "Мы применяем стандартные отраслевые меры безопасности: транспортное шифрование HTTPS/TLS 1.3, HSTS preload, строгая Content Security Policy, зашифрованные подключения к базе данных, хранение IP в виде хэшей, ограничение частоты запросов, row-level security на таблицах БД, ограниченный сервисный ключ, зашифрованные резервные копии. Ни одна система не обеспечивает 100% безопасности; в случае утечки персональных данных, затрагивающей ваши права, мы уведомим соответствующий надзорный орган в течение 72 часов, а затронутых пользователей — без неоправданной задержки, как того требуют статьи 33-34 GDPR."
                : 'We implement industry-standard security measures: HTTPS/TLS 1.3 transport encryption, HSTS preload, strict Content Security Policy, encrypted database connections, hashed IP storage, rate limiting, row-level security on database tables, restricted service role keys, encrypted backups at rest. No system is 100% secure; in the event of a personal data breach affecting your rights, we will notify the relevant supervisory authority within 72 hours and affected users without undue delay, as required by GDPR Article 33-34.'}
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold">
              {isRu ? "11. Изменения политики" : "11. Changes to this policy"}
            </h2>
            <p className="text-sm leading-relaxed text-foreground/90">
              {isRu
                ? "Мы можем обновлять настоящую Политику конфиденциальности время от времени. О существенных изменениях будет объявлено в приложении через баннер-уведомление не менее чем за 14 дней до вступления в силу. Текущая версия и дата последнего обновления всегда видны вверху этой страницы. Предыдущие версии доступны по запросу."
                : "We may update this Privacy Policy from time to time. Material changes will be announced in the application via a notification banner at least 14 days before taking effect. The current version and last updated date are always visible at the top of this page. Previous versions are available on request."}
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold">
              {isRu ? "12. Контакты" : "12. Contact"}
            </h2>
            {isRu ? (
              <div className="text-sm leading-relaxed text-foreground/90 space-y-2">
                <p>По любым вопросам, запросам или жалобам, связанным с конфиденциальностью:</p>
                <ul className="list-disc pl-6 space-y-1">
                  <li><strong>Email:</strong> <Mailto addr="privacy@h3master.app" /></li>
                  <li><strong>Почтовый адрес:</strong> Доступен по запросу через email.</li>
                </ul>
                <p>Сервис эксплуатируется частным лицом, базирующимся в Латвии. Назначение Уполномоченного по защите данных (DPO) не является обязательным согласно статье 37 GDPR, однако мы реагируем на все обращения в течение 30 дней.</p>
              </div>
            ) : (
              <div className="text-sm leading-relaxed text-foreground/90 space-y-2">
                <p>For any privacy-related question, request, or complaint:</p>
                <ul className="list-disc pl-6 space-y-1">
                  <li><strong>Email:</strong> <Mailto addr="privacy@h3master.app" /></li>
                  <li><strong>Postal address:</strong> Available on request via email.</li>
                </ul>
                <p>The Service is operated by an individual based in Latvia. We are not subject to mandatory Data Protection Officer (DPO) appointment under GDPR Article 37, but we welcome and act on all inquiries within 30 days.</p>
              </div>
            )}
          </section>

          <Footer />
        </div>
      </main>
    </div>
  );
}
