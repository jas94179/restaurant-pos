import json
C=[]
def c(name, light, dark=None, usage=""):
    v = light if dark is None else {"light": light, "dark": dark}
    C.append({"name": name, "value": v, "usage": usage})
# --- primitives (same in both themes)
P = {
 "green": [("900","#0B1F17","Deepest green: cash-box slot, footer, dark scrims."),("800","#0F2A1F","Deep green: text on turmeric, brand on dark."),
           ("700","#17382A","Curry leaf, the brand colour."),("600","#1F4A37","Brand tint for panels on brand."),("500","#2C5A44","Mid green for borders on brand."),
           ("400","#557A68","Input borders in dark theme."),("300","#9DB8AA","Decorative only; too pale for text on white."),
           ("200","#CFE0D6","Muted text on brand green."),("100","#E5EEE9","Selected tint."),("50","#F3F6F4","Rice paper: the app background.")],
 "turmeric": [("800","#8A5B00","Warning text on light grounds."),("600","#C98C07","Coin rim; never text."),("500","#F2B01E","Turmeric, the accent colour."),
              ("300","#F2C04A","Warning text on dark grounds."),("100","#FBF0D2","Warning tint."),("50","#FFF6DE","Highlight tint (table rows, notes).")],
 "neutral": [("900","#102018","Ink: primary text."),("600","#5E6E66","Muted text and placeholders."),("500","#7D9188","Control borders (3:1)."),
             ("300","#DDE3E0","Hairlines and dividers."),("0","#FFFFFF","Paper: cards and sheets.")],
 "success": [("700","#167A33","Success text and paid fills (white text 5.4:1)."),("600","#1B8A3A","Veg mark."),("300","#7ED39A","Success on dark."),("100","#E6F4EA","Success tint.")],
 "danger": [("600","#B3261E","Danger text and fills; non-veg mark."),("300","#FFB4AB","Danger on dark."),("100","#FDE7E4","Danger tint.")],
}
for fam, rows in P.items():
    for step, val, u in rows: c(f"{fam}-{step}", val, None, u)
# --- semantic (light alias / dark value)
S = [
 ("bg-app","{green-50}","#0D1A14","Screen background behind cards."),
 ("bg-surface","{neutral-0}","#13251C","Cards, tiles, list groups; text-primary and text-secondary read on it."),
 ("bg-raised","{neutral-0}","#1A2F24","Bottom sheets and menus."),
 ("bg-brand","{green-700}","#18392A","App header, hero bands, the Pro plan card; use text-on-brand."),
 ("bg-selected","{green-100}","#1C3328","Selected chip, segment or row; pair with border-selected and text-link."),
 ("bg-scrim","rgba(15,42,31,0.55)","rgba(0,0,0,0.6)","Dim behind bottom sheets."),
 ("text-primary","{neutral-900}","#E7F0EA","Main text on bg-app, bg-surface, bg-raised (5:1+ in both themes)."),
 ("text-secondary","{neutral-600}","#A9BFB2","Secondary text and placeholders on bg-app, bg-surface (4.9:1 light, 8:1 dark)."),
 ("text-on-brand","{neutral-0}","#FFFFFF","Text on bg-brand and action-primary (12.8:1)."),
 ("text-on-brand-muted","{green-200}","{green-200}","Secondary text on bg-brand."),
 ("text-on-accent","{green-800}","{green-800}","Text on turmeric fills: Offline chip, accent buttons (8:1)."),
 ("text-link","{green-700}","#74CC9E","Links, text buttons, selected labels."),
 ("border-default","{neutral-300}","#26402F","Dividers and card outlines (decorative)."),
 ("border-input","{neutral-500}","{green-400}","Inputs, chips and segments at rest (3:1 on surfaces)."),
 ("border-selected","{green-700}","#74CC9E","Selected tile, chip or segment outline."),
 ("border-focus","{turmeric-800}","{turmeric-500}","Keyboard focus ring, 2px solid with a 2px gap (5.9:1 light, 8.4:1 dark)."),
 ("action-primary","{green-700}","#74CC9E","Main buttons: Save, Send to kitchen, Done."),
 ("action-primary-text","{neutral-0}","{green-900}","Label on action-primary."),
 ("action-primary-pressed","{green-800}","#5FB98A","Pressed state of action-primary."),
 ("action-accent","{turmeric-500}","{turmeric-500}","The one big call to action per screen: Show UPI QR, Free trial."),
 ("action-accent-text","{green-800}","{green-800}","Label on action-accent."),
 ("action-danger","{danger-600}","{danger-300}","Destructive buttons: Cancel this bill."),
 ("action-danger-text","{neutral-0}","{green-900}","Label on action-danger."),
 ("action-disabled","{neutral-300}","#26402F","Disabled button fill."),
 ("action-disabled-text","{neutral-600}","#A9BFB2","Disabled button label."),
 ("status-success","{success-700}","{success-300}","Paid, Cash matches, Saved; text on surfaces or status-success-bg."),
 ("status-success-bg","{success-100}","#16351F","Success tint behind status-success text."),
 ("status-danger","{danger-600}","{danger-300}","Short, errors, cancelled; text on surfaces or status-danger-bg."),
 ("status-danger-bg","{danger-100}","#3A1A17","Danger tint behind status-danger text."),
 ("status-warning","{turmeric-800}","{turmeric-300}","Extra cash, unsent kitchen items; text on surfaces or status-warning-bg."),
 ("status-warning-bg","{turmeric-100}","#3A2E10","Warning tint."),
 ("status-offline","{turmeric-500}","{turmeric-500}","Offline chip fill; label in text-on-accent."),
 ("food-veg","{success-600}","{success-300}","Veg mark on dish tiles."),
 ("food-non-veg","{danger-600}","{danger-300}","Non-veg mark on dish tiles."),
]
for n,l,d,u in S: c(n,l,d,u)

T = {"name":"galla Design System","version":1,
 "meta":{"source":"github","repo":"jas94179/restaurant-pos","package":"app","paths":{"tokens":["app/src/theme.ts","app/src/**/*.tsx (audit)"],"assets":["app/assets/"]},"synced":"2026-10-11","note":"Values audited from the app and cleaned up; dark theme defined here, app ships light only for now."},
 "color":{"themes":[{"id":"light","name":"Light"},{"id":"dark","name":"Dark"}],"tokens":C},
 "type":{"fonts":[],
   "families":{"app":"\"Bricolage Grotesque\", system-ui, sans-serif","marketing":"Poppins, \"Segoe UI\", system-ui, sans-serif","mono":"\"IBM Plex Mono\", ui-monospace, Menlo, monospace"},
   "groups":[
    {"name":"App","family":"app","note":"Bricolage Grotesque in three weights: 400, 600, 800. Product UI and product web.","styles":[
      {"name":"display-hero","fontSize":"72px","lineHeight":"76px","fontWeight":800,"letterSpacing":"-0.04em","sample":"galla","usage":"Splash and wordmark only."},
      {"name":"display","fontSize":"40px","lineHeight":"44px","fontWeight":800,"letterSpacing":"-0.02em","sample":"Welcome to galla","usage":"Big totals, onboarding titles."},
      {"name":"amount","fontSize":"32px","lineHeight":"36px","fontWeight":800,"sample":"₹231","usage":"QR amount, day-close result. Tabular numbers."},
      {"name":"title-lg","fontSize":"28px","lineHeight":"34px","fontWeight":800,"sample":"Restaurant details","usage":"Screen titles."},
      {"name":"title-md","fontSize":"22px","lineHeight":"28px","fontWeight":800,"sample":"Cancel this bill","usage":"Sheet titles, section heads."},
      {"name":"title-sm","fontSize":"18px","lineHeight":"24px","fontWeight":800,"sample":"Receipt printer","usage":"Card titles."},
      {"name":"body-lg","fontSize":"16px","lineHeight":"24px","fontWeight":400,"sample":"Leave it empty to choose a contact inside WhatsApp.","usage":"Inputs and main reading text."},
      {"name":"body-md","fontSize":"15px","lineHeight":"22px","fontWeight":400,"sample":"Everyone gets their own PIN, so every bill shows who made it.","usage":"List rows; dish names in semibold."},
      {"name":"body-sm","fontSize":"14px","lineHeight":"20px","fontWeight":400,"sample":"Not sure which rate applies? Check with your CA.","usage":"Secondary text; chip labels in semibold."},
      {"name":"label-lg","fontSize":"16px","lineHeight":"20px","fontWeight":800,"sample":"Send to kitchen","usage":"Primary and accent button labels."},
      {"name":"label-md","fontSize":"15px","lineHeight":"20px","fontWeight":600,"sample":"Print test page","usage":"Secondary and text buttons."},
      {"name":"label-sm","fontSize":"13px","lineHeight":"18px","fontWeight":600,"sample":"Offline","usage":"Small buttons, badges, tab labels (12px tab label maps here)."},
      {"name":"caption","fontSize":"12px","lineHeight":"17px","fontWeight":400,"sample":"Updated when you open this tab","usage":"Fine print, timestamps."}]},
    {"name":"Marketing","family":"marketing","note":"Poppins for brochures, posts, reels and the case study. Never inside the app.","styles":[
      {"name":"mkt-hero","fontSize":"128px","lineHeight":"120px","fontWeight":700,"letterSpacing":"-0.05em","sample":"galla","usage":"Covers and reel end cards."},
      {"name":"mkt-headline","fontSize":"44px","lineHeight":"50px","fontWeight":700,"letterSpacing":"-0.03em","sample":"A bill in three taps.","usage":"Page and slide headlines."},
      {"name":"mkt-lead","fontSize":"18px","lineHeight":"28px","fontWeight":400,"sample":"Your staff can learn galla in five minutes.","usage":"Intro paragraphs."},
      {"name":"mkt-kicker","fontSize":"13px","lineHeight":"18px","fontWeight":700,"letterSpacing":"0.16em","sample":"HOW IT WORKS","usage":"Uppercase section labels."},
      {"name":"mkt-caption","fontSize":"46px","lineHeight":"58px","fontWeight":600,"sample":"Tap the dish. Tap again for two.","usage":"Reel captions at 1080×1920."}]},
    {"name":"Data","family":"mono","note":"Mono for invoice numbers, codes and receipt previews on screen.","styles":[
      {"name":"code","fontSize":"13px","lineHeight":"20px","fontWeight":400,"sample":"INV-2627-000123","usage":"Invoice numbers, UPI IDs."},
      {"name":"receipt","fontSize":"14px","lineHeight":"20px","fontWeight":400,"sample":"Masala Dosa x2          180","usage":"On-screen receipt previews (32 columns)."}]}]},
 "spacing":{"note":"4-point scale with half steps for dense counter screens. Screen side padding is space-16.","tokens":[
   {"name":f"space-{v}","value":f"{v}px","usage":u} for v,u in [(0,"Flush."),(2,"Hairline gaps, icon nudge."),(4,"Icon to label."),(6,"Chip internal gaps."),(8,"Inside controls, tight stacks."),
   (10,"Chip vertical padding."),(12,"Default gap between tiles and rows."),(14,"Chip horizontal padding."),(16,"Screen side padding, card padding."),(20,"Sheet padding."),
   (24,"Between groups."),(28,"Large card padding."),(32,"Between sections."),(40,"Empty-state spacing."),(48,"Screen top spacing."),(64,"Hero spacing.")]]},
 "radius":{"note":"Soft, rounded, friendly. 24 values in the app became 9.","tokens":[
   {"name":"radius-none","value":"0px","usage":"Receipts and printed paper."},{"name":"radius-xs","value":"4px","usage":"Veg mark, small badges."},
   {"name":"radius-sm","value":"8px","usage":"Small buttons, out-of-stock button."},{"name":"radius-md","value":"12px","usage":"Inputs, dish tiles, segments."},
   {"name":"radius-lg","value":"14px","usage":"Buttons."},{"name":"radius-xl","value":"16px","usage":"Cards and list groups."},
   {"name":"radius-2xl","value":"20px","usage":"Large panels and toasts."},{"name":"radius-3xl","value":"28px","usage":"Bottom sheet top corners."},
   {"name":"radius-full","value":"9999px","usage":"Chips, pills, avatars, PIN dots."}]},
 "shadow":{"note":"The app is flat with borders. Shadows are for floating layers, the web and marketing.","tokens":[
   {"name":"shadow-1","value":{"light":"0 1px 2px rgba(16,32,24,0.08)","dark":"0 1px 2px rgba(0,0,0,0.4)"},"usage":"Web cards on hover."},
   {"name":"shadow-2","value":{"light":"0 8px 24px rgba(16,32,24,0.12)","dark":"0 8px 24px rgba(0,0,0,0.5)"},"usage":"Bottom sheets, menus, toasts."},
   {"name":"shadow-3","value":{"light":"0 24px 48px rgba(16,32,24,0.18)","dark":"0 24px 48px rgba(0,0,0,0.6)"},"usage":"Marketing phone mockups."}]},
 "size":{"note":"Nothing tappable under 44px.","tokens":[
   {"name":"size-control-sm","value":"36px","usage":"Out-of-stock and small buttons."},{"name":"size-control-md","value":"44px","usage":"Secondary, text and segment buttons; minimum touch target."},
   {"name":"size-control-lg","value":"52px","usage":"Primary, accent and danger buttons."},{"name":"size-input","value":"48px","usage":"Text inputs and search."},
   {"name":"size-icon","value":"24px","usage":"Tab bar and header icons."},{"name":"size-avatar","value":"40px","usage":"Staff rows."},{"name":"size-tab-bar","value":"64px","usage":"Bottom tab bar height before safe area."}]},
 "stroke":{"note":"Border widths.","tokens":[{"name":"stroke-hairline","value":"1px","usage":"Dividers, card outlines."},{"name":"stroke-default","value":"1.5px","usage":"Inputs, chips, ghost buttons."},{"name":"stroke-selected","value":"2px","usage":"Selected tile, focus ring."}]},
 "duration":{"note":"From the bottom sheet. Respect reduced motion.","tokens":[{"name":"duration-fast","value":"120ms","usage":"Press feedback."},{"name":"duration-base","value":"200ms","usage":"Fades, closing a sheet."},{"name":"duration-sheet","value":"260ms","usage":"Opening a bottom sheet."}]},
 "easing":{"note":"Cubic curves from the bottom sheet.","tokens":[{"name":"ease-enter","value":"cubic-bezier(0.33, 1, 0.68, 1)","usage":"Things arriving: sheets, toasts."},{"name":"ease-exit","value":"cubic-bezier(0.32, 0, 0.67, 0)","usage":"Things leaving."}]},
 "opacity":{"tokens":[{"name":"opacity-off","value":"0.55","usage":"Out-of-stock dish tiles."}]}
}
s=json.dumps(T,indent=1,ensure_ascii=False)
open('project/tokens.json','w').write(s)
open('/home/claude/restaurant-pos/design-system/tokens.json','w').write(s)
print(len(C),'colors', len(s),'bytes')
