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

function Mailto({ addr }: { addr: string }) {
  return (
    <a href={`mailto:${addr}`} className="text-primary hover:underline">
      {addr}
    </a>
  );
}

export default function TermsPage() {
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
      <SEOMeta routeKey="terms" />
      <TopAppBar
        title={isRu ? "Условия использования" : "Terms of Service"}
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
              {isRu ? "Условия использования" : "Terms of Service"}
            </h1>
            <p className="text-sm text-muted-foreground">
              {isRu ? "Последнее обновление: 15 мая 2026" : "Last updated: 15 May 2026"}
            </p>
          </header>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold">
              {isRu ? "1. Принятие условий" : "1. Acceptance of terms"}
            </h2>
            <p className="text-sm leading-relaxed text-foreground/90">
              {isRu
                ? "Используя H3 Master («Сервис») по адресу h3master.app, вы соглашаетесь соблюдать настоящие Условия использования («Условия»). Если вы не согласны — не используйте Сервис. Настоящие Условия образуют обязывающее соглашение между вами и оператором Сервиса."
                : 'By accessing or using H3 Master (the "Service") at h3master.app, you agree to be bound by these Terms of Service (the "Terms"). If you do not agree, do not use the Service. These Terms form a binding agreement between you and the operator of the Service.'}
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold">
              {isRu ? "2. Описание сервиса" : "2. Description of service"}
            </h2>
            <p className="text-sm leading-relaxed text-foreground/90">
              {isRu
                ? "H3 Master — бесплатное некоммерческое неофициальное фанатское приложение-компаньон для игроков в настольную игру «Герои Меча и Магии III», изданную Archon Studio. Сервис предоставляет справочные материалы (правила, сценарии, карточки юнитов, героев, заклинания, артефакты), настраиваемого ИИ-помощника Мастера игры, голосовой ввод запросов и генератор подготовки партии. Сервис представлен в виде Прогрессивного веб-приложения, работающего офлайн после первой загрузки."
                : "H3 Master is a free, non-commercial, unofficial fan-made companion application for players of the board game Heroes of Might & Magic III: The Board Game, published by Archon Studio. The Service provides reference materials (rules, scenarios, unit cards, hero cards, spells, artifacts), a configurable AI Game Master assistant, voice query input, and a Game Setup generator. The Service is provided as a Progressive Web App that works offline after first load."}
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold">
              {isRu ? "3. Право использования" : "3. Eligibility"}
            </h2>
            <p className="text-sm leading-relaxed text-foreground/90">
              {isRu
                ? "Для использования Сервиса вам должно быть не менее 16 лет. Используя Сервис, вы подтверждаете соответствие этому требованию. Настольная игра, для которой создан компаньон, имеет рекомендованный издателем возраст 14+."
                : "You must be at least 16 years of age to use the Service. By using the Service you represent that you meet this requirement. The board game itself carries a publisher-recommended age of 14+."}
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold">
              {isRu ? "4. Интеллектуальная собственность" : "4. Intellectual property"}
            </h2>
            {isRu ? (
              <div className="text-sm leading-relaxed text-foreground/90 space-y-3">
                <p>Heroes of Might & Magic является торговой маркой Ubisoft Entertainment. «Герои Меча и Магии III: Настольная игра» и весь связанный игровой дизайн, сценарии, имена персонажей, иллюстрации и текст правил являются интеллектуальной собственностью Ubisoft Entertainment, Archon Studio и соответствующих правообладателей. H3 Master — неофициальное фанатское приложение-компаньон. Мы не аффилированы с Ubisoft Entertainment, Archon Studio или другими правообладателями, не одобрены и не спонсируются ими.</p>
                <p>Игровой контент представлен в Сервисе в рамках принципов добросовестного использования для целей фанатского сопровождения, образования и справки. Если вы являетесь правообладателем и считаете, что контент должен быть удалён, свяжитесь с нами по адресу privacy@h3master.app — мы оперативно отреагируем.</p>
                <p>Код приложения, дизайн и оригинальные комментарии в H3 Master защищены авторским правом © 2026 оператор. Копирование, распространение или модификация кода приложения без предварительного письменного разрешения запрещены, за исключением случаев, разрешённых применимым законодательством (например, добросовестное использование, научные исследования).</p>
              </div>
            ) : (
              <div className="text-sm leading-relaxed text-foreground/90 space-y-3">
                <p>Heroes of Might & Magic is a trademark of Ubisoft Entertainment. Heroes of Might & Magic III: The Board Game and all associated game design, scenarios, character names, artwork, and rulebook text are the intellectual property of Ubisoft Entertainment, Archon Studio, and their respective rights holders. H3 Master is an unofficial fan-made companion. We are not affiliated with, endorsed by, or sponsored by Ubisoft Entertainment, Archon Studio, or any other rights holder.</p>
                <p>Game content is presented in this Service under principles of fair use for the purpose of fan companionship, education, and reference. If you are a rights holder and believe content should be removed, please contact us at privacy@h3master.app and we will respond promptly.</p>
                <p>The application code, design, and original commentary in H3 Master are © 2026 the operator. You may NOT copy, redistribute, or modify the application code without prior written permission, except as permitted by applicable law (e.g. fair use, research).</p>
              </div>
            )}
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold">
              {isRu ? "5. Допустимое использование" : "5. Acceptable use"}
            </h2>
            <p className="text-sm leading-relaxed text-foreground/90">
              {isRu ? "Используя Сервис, вы соглашаетесь НЕ:" : "When using the Service, you agree NOT to:"}
            </p>
            <ul className="list-disc pl-6 space-y-2 text-sm leading-relaxed text-foreground/90">
              {isRu ? (
                <>
                  <li>Использовать автоматические скрипты, парсеры или ботов сверх установленных ограничений (в настоящее время — 40 запросов к ИИ в час на хэшированный IP).</li>
                  <li>Подвергать обратной разработке, декомпилировать или пытаться извлечь исходный код любых непубличных частей Сервиса.</li>
                  <li>Пытаться обойти аутентификацию, ограничение частоты запросов или контроль доступа.</li>
                  <li>Отправлять контент, предназначенный для нанесения вреда Сервису или другим пользователям (вредоносная нагрузка, попытки prompt injection и т.п.).</li>
                  <li>Использовать Сервис для генерации контента, который является незаконным, вредоносным или нарушает права третьих лиц.</li>
                  <li>Перепродавать, сублицензировать или использовать Сервис в коммерческих целях без явного разрешения.</li>
                </>
              ) : (
                <>
                  <li>Use automated scripts, scrapers, or bots beyond the published rate limits (currently 40 AI queries per hour per hashed IP).</li>
                  <li>Reverse engineer, decompile, or attempt to extract source code of any non-public part of the Service.</li>
                  <li>Attempt to bypass authentication, rate limiting, or access controls.</li>
                  <li>Submit content intended to harm the Service or other users (malicious payloads, attempts at prompt injection, etc.).</li>
                  <li>Use the Service to generate content that is illegal, harmful, or violates third-party rights.</li>
                  <li>Resell, sublicense, or use the Service for commercial purposes without explicit permission.</li>
                </>
              )}
            </ul>
            <p className="text-sm leading-relaxed text-foreground/90">
              {isRu
                ? "Мы оставляем за собой право обеспечивать эти ограничения техническими средствами (ограничение частоты, блокировка IP) и отказывать в обслуживании любому, кто их нарушает."
                : "We reserve the right to enforce these limits technically (rate limiting, IP blocks) and to refuse service to anyone who violates them."}
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold">
              {isRu ? "6. Отказ от ответственности — ИИ Мастер" : "6. AI Game Master disclaimer"}
            </h2>
            {isRu ? (
              <div className="text-sm leading-relaxed text-foreground/90 space-y-3">
                <p>Функция ИИ Мастера игры предоставляет интерпретации правил игры на основе базы знаний, извлечённой из официальных PDF-файлов правил и дополнительных материалов. Ответы ИИ генерируются автоматически и могут содержать ошибки, упущения или неправильные интерпретации. Официальный печатный свод правил является авторитетным источником в случае любых разногласий. Не полагайтесь на ответы ИИ Мастера в турнирной или соревновательной игре без независимой проверки.</p>
                <p>Вы понимаете, что ответы ИИ иногда могут содержать информацию, которая выглядит уверенно, но неверна («галлюцинации»). Мы постоянно работаем над снижением этого через улучшение поиска и проектирования промптов.</p>
              </div>
            ) : (
              <div className="text-sm leading-relaxed text-foreground/90 space-y-3">
                <p>The AI Game Master feature provides interpretations of game rules based on a knowledge base extracted from the official rulebook PDFs and supplementary materials. AI responses are AI-generated and may contain errors, omissions, or misinterpretations. The official printed rulebook is the authoritative source for any rules dispute. Do not rely on AI Game Master output for tournament or competitive play without independent verification.</p>
                <p>You acknowledge that AI responses may occasionally produce information that appears confident but is incorrect ("hallucinations"). We continuously work to reduce this through improved retrieval and prompt engineering.</p>
              </div>
            )}
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold">
              {isRu ? "7. Доступность и изменения сервиса" : "7. Service availability and changes"}
            </h2>
            <p className="text-sm leading-relaxed text-foreground/90">
              {isRu
                ? "Сервис предоставляется «как есть» и «как доступно». Мы не гарантируем непрерывной доступности, отсутствия ошибок или пригодности для какой-либо конкретной цели. Мы можем изменять, приостанавливать или прекращать любую функцию или Сервис целиком в любое время без предварительного уведомления. Мы прилагаем максимум усилий, чтобы заранее объявлять о существенных изменениях (плановый простой, прекращение функций) в приложении или в репозитории GitHub."
                : 'The Service is provided on an "as is" and "as available" basis. We do not guarantee uninterrupted availability, freedom from errors, or fitness for any particular purpose. We may modify, suspend, or discontinue any feature, or the Service entirely, at any time without prior notice. We make best effort to announce significant changes (planned downtime, feature retirement) in-app or on the GitHub repository.'}
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold">
              {isRu ? "8. Ограничение ответственности" : "8. Limitation of liability"}
            </h2>
            <p className="text-sm leading-relaxed text-foreground/90">
              {isRu
                ? "В максимальной степени, разрешённой применимым законодательством, ни при каких обстоятельствах оператор Сервиса не несёт ответственности за любой косвенный, случайный, особый, последующий или штрафной ущерб, а также за любую потерю прибыли, дохода, данных, использования, деловой репутации или других нематериальных потерь, возникающих из использования Сервиса или связанных с ним. Это ограничение не применяется к ответственности за грубую неосторожность, умышленные действия или ущерб, который не может быть ограничен в соответствии с применимым обязательным законодательством (например, законодательством о защите прав потребителей)."
                : "To the maximum extent permitted by applicable law, in no event will the operator of the Service be liable for any indirect, incidental, special, consequential, or punitive damages, or any loss of profits, revenue, data, use, goodwill, or other intangible losses, arising out of or in connection with your use of the Service. This limitation does not apply to liability for gross negligence, wilful misconduct, or damages that cannot be limited under applicable mandatory law (e.g. consumer protection law)."}
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold">
              {isRu ? "9. Конфиденциальность" : "9. Privacy"}
            </h2>
            <p className="text-sm leading-relaxed text-foreground/90">
              {isRu ? (
                <>Конфиденциальность вашей информации регулируется нашей <Link to="/privacy" className="text-primary hover:underline">Политикой конфиденциальности</Link>, которая является неотъемлемой частью настоящих Условий.</>
              ) : (
                <>Your privacy is governed by our <Link to="/privacy" className="text-primary hover:underline">Privacy Policy</Link>, which is incorporated into these Terms by reference.</>
              )}
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold">
              {isRu ? "10. Применимое право и споры" : "10. Governing law and disputes"}
            </h2>
            <p className="text-sm leading-relaxed text-foreground/90">
              {isRu
                ? "Настоящие Условия регулируются законодательством Латвийской Республики без учёта норм коллизионного права. Императивные положения права ЕС (включая GDPR) применяются дополнительно, если они предоставляют вам более широкую защиту. Любой спор, возникающий из настоящих Условий или связанный с ними, сначала подлежит мирному урегулированию через прямое обращение по адресу privacy@h3master.app. В случае невозможности — юрисдикция судов Латвии, с учётом вашего права как потребителя обратиться в суд по месту жительства в соответствии с законодательством ЕС о защите прав потребителей."
                : "These Terms are governed by the laws of the Republic of Latvia, without regard to its conflict-of-law principles. Mandatory provisions of EU law (including GDPR) apply additionally where they grant you broader protection. Any dispute arising out of or in connection with these Terms shall first be attempted to be resolved amicably by direct contact at privacy@h3master.app. If that fails, the courts of Latvia shall have jurisdiction, subject to your right as a consumer to bring proceedings in your country of residence under EU consumer protection law."}
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold">
              {isRu ? "11. Изменения условий" : "11. Changes to terms"}
            </h2>
            <p className="text-sm leading-relaxed text-foreground/90">
              {isRu
                ? "Мы можем периодически пересматривать настоящие Условия. О существенных изменениях будет объявлено в приложении через баннер-уведомление не менее чем за 14 дней до вступления в силу. Продолжение использования Сервиса после даты вступления в силу означает согласие с обновлёнными Условиями. Если вы не согласны с обновлёнными Условиями — прекратите использование Сервиса."
                : "We may revise these Terms from time to time. Material changes will be announced in-app via a notification banner at least 14 days before taking effect. Continued use of the Service after the effective date constitutes acceptance of the revised Terms. If you do not agree with revised Terms, you must stop using the Service."}
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold">
              {isRu ? "12. Контакты" : "12. Contact"}
            </h2>
            <p className="text-sm leading-relaxed text-foreground/90">
              {isRu ? (
                <>По любым вопросам относительно настоящих Условий: <Mailto addr="privacy@h3master.app" /></>
              ) : (
                <>For any question regarding these Terms: <Mailto addr="privacy@h3master.app" /></>
              )}
            </p>
          </section>

          <Footer />
        </div>
      </main>
    </div>
  );
}
