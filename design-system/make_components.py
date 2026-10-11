import os, json
ROOT = 'project/components'
# name: (group, height, render expression using G and h, readme, props)
C = {
'Logo': ('Brand', 120, "h('div',{className:'gl-stage'},h(G.Logo,{size:64}),h(G.Logo,{size:48,wordmark:true}))",
 """The coin-in-the-cash-box mark, used as the app icon and next to the wordmark.

- Use the real files from the Logos asset group; never redraw the coin or change its colours.
- With the wordmark, the word "galla" is always lowercase, in Bricolage Grotesque ExtraBold.
- Keep clear space of at least a quarter of the mark's width on every side.
- On photos or busy grounds, use the square icon (green tile) rather than the bare coin.""",
 "size?: number; wordmark?: boolean"),
'Button': ('Actions', 200, "h('div',{className:'gl-stack',style:{maxWidth:'none'}},h('div',{className:'gl-stage',style:{padding:0}},h(G.Button,null,'Send to kitchen'),h(G.Button,{variant:'accent'},'Show UPI QR · ₹231'),h(G.Button,{variant:'secondary'},'Print'),h(G.Button,{variant:'danger'},'Cancel this bill')),h('div',{className:'gl-stage',style:{padding:0}},h(G.Button,{size:'md',variant:'secondary'},'Print test page'),h(G.Button,{variant:'text',size:'md'},'Keep bill'),h(G.Button,{size:'sm',variant:'secondary'},'Decline'),h(G.Button,{loading:true},'Saving'),h(G.Button,{disabled:true},'Send to kitchen')))",
 """Buttons start the main action on a screen. Labels are short verbs in sentence case: "Send to kitchen", "Print test page".

- **primary** (`action-primary`): the main action of a sheet or screen. One per view.
- **accent** (`action-accent`, turmeric): the one money moment per screen, such as "Show UPI QR · ₹231" or "Free trial". Never two on one screen.
- **secondary**: the alternatives beside a primary (Print, WhatsApp).
- **danger** (`action-danger`): destructive and recorded actions, such as "Cancel this bill". Always pair with a text button to back out ("Keep bill").
- **text**: low-weight exits and links inside sheets.
- Sizes: `lg` 52px for main actions, `md` 44px, `sm` 36px only on web or dense rows. Nothing tappable under 44px on phones.
- Put the amount in the label when money moves ("Show UPI QR · ₹231").
- A loading button keeps its label ("Saving") and blocks double taps.""",
 "variant?: 'primary' | 'accent' | 'secondary' | 'danger' | 'success' | 'text'; size?: 'lg' | 'md' | 'sm'; block?: boolean; loading?: boolean; disabled?: boolean; onClick?: () => void; children?: React.ReactNode"),
'BackLink': ('Navigation', 72, "h('div',{className:'gl-stage'},h(G.BackLink,null,'Profile'),h(G.BackLink,null,'All tables'))",
 """A back link at the top of a sub-screen, written as "‹ Profile" with the name of the screen it returns to.

- Use it on every screen opened from Profile, and on a table's order ("‹ All tables").
- It is a 44px tall touch target even though it looks like text.""",
 "href?: string; children?: React.ReactNode"),
'Chip': ('Selection', 80, "h('div',{className:'gl-stage'},h(G.Chip,{selected:true},'All'),h(G.Chip,null,'South Indian'),h(G.Chip,null,'Drinks'),h(G.Chip,{selected:true,tone:'solid'},'This month'),h(G.Chip,null,'Less spicy'))",
 """Chips filter a list (menu categories, report periods) or add quick choices (kitchen notes, discount reasons).

- Selected chips use `bg-selected`, `border-selected` and `text-link`. Use `tone="solid"` only for a single period picker where one value is always chosen.
- One line of 1–3 words. Rows scroll sideways on phones instead of wrapping into many lines.
- Quick-note chips ("Less spicy", "Jain") add text; they never replace typing.""",
 "selected?: boolean; tone?: 'outline' | 'solid'; onClick?: () => void; children?: React.ReactNode"),
'Segmented': ('Selection', 80, "h('div',{className:'gl-stack'},h(G.Segmented,{label:'Payment',options:['Cash','UPI','Card'],value:'UPI'}))",
 """A segmented control picks one of 2–4 options that are all visible at once, such as payment mode or order type.

- Payment is always Cash · UPI · Card, in that order.
- The selected segment uses `action-primary`. Labels are one word.
- Use Tabs for switching views, and Segmented for picking a value.""",
 "options: string[]; value?: string; label?: string; onChange?: (value: string) => void"),
'Tabs': ('Navigation', 80, "h('div',{className:'gl-stack'},h(G.Tabs,{tabs:['Terms of use','Privacy notice']}))",
 """Pill tabs switch between two or three views of the same thing, such as Terms of use and Privacy notice.

- The selected tab sits on `bg-surface` inside a `border-default` track.
- Never use tabs for main navigation; that is the TabBar.""",
 "tabs: string[]; value?: string"),
'Switch': ('Selection', 150, "h('div',{className:'gl-stack'},h(G.Switch,{label:'Print bill automatically',hint:'After every payment.',checked:true}),h(G.Switch,{label:'Contact me about the trial'}))",
 """A switch turns a setting on or off right away, with no save button.

- The label says what happens when it is on ("Print bill automatically").
- Add a one-line hint when the effect is not obvious.
- For agreeing to terms, use Checkbox.""",
 "label: string; hint?: string; checked?: boolean"),
'Checkbox': ('Selection', 140, "h('div',{className:'gl-stack'},h(G.Checkbox,{label:'I have read the Terms of Use.',checked:true,required:true}),h(G.Checkbox,{label:'I agree to the Privacy Notice.',required:true}),h(G.Checkbox,{label:'Contact me about the trial and updates.'}))",
 """Checkboxes collect agreement, such as the three required ticks at sign-up.

- Required items say so in words ("Required"), not only with a colour.
- Optional consent (contact permission) is unticked by default.""",
 "label: string; checked?: boolean; required?: boolean"),
'TextField': ('Inputs', 310, "h('div',{className:'gl-stack'},h(G.TextField,{label:'Name on bills',value:'Singh Sweets'}),h(G.TextField,{label:'Amount',prefix:'₹',value:'50',inputMode:'numeric',hint:'Applied before GST.'}),h(G.TextField,{label:'FSSAI licence number',value:'1122334455',error:'FSSAI numbers have 14 digits.'}))",
 """A text field takes one line of input with a label above it.

- Labels are nouns from the owner's world: "Name on bills", "Phone on bills", "Your UPI ID".
- Hints say what happens or why ("Leave it empty to choose a contact inside WhatsApp"). Errors say how to fix it ("FSSAI numbers have 14 digits").
- Money fields show a ₹ prefix and open the number keypad.
- Height is `size-input` (48px); text is 16px so phones don't zoom.""",
 "label?: string; value?: string; placeholder?: string; hint?: string; error?: string; prefix?: string; inputMode?: string; disabled?: boolean"),
'SearchField': ('Inputs', 90, "h('div',{className:'gl-stack'},h(G.SearchField,{placeholder:'Search items'}))",
 """The search box at the top of the counter menu and bills list.

- The placeholder names what is searched ("Search items", "Token or invoice number").
- Results filter as you type; there is no search button.""",
 "placeholder?: string; value?: string"),
'DishTile': ('Billing', 180, "h('div',{className:'gl-stage'},h(G.DishTile,{name:'Masala Dosa',price:90}),h(G.DishTile,{name:'Vada',price:40,qty:2,state:'selected'}),h(G.DishTile,{name:'Chicken 65',price:220,veg:false}),h(G.DishTile,{name:'Filter Coffee',price:30,state:'out'}))",
 """A dish on the counter menu: tap ADD, then use the stepper to change the count.

- States: rest (ADD), selected with a quantity (stepper, `border-selected` 2px), out of stock (`opacity-off`, no ADD).
- Always show the veg or non-veg mark; it is a legal and trust signal in India.
- Long-press a tile to mark it out of stock.
- Tiles sit two per row on phones; a half-filled last row keeps empty spacers, so no tile ever stretches wider than the others.""",
 "name: string; price: number; veg?: boolean; qty?: number; state?: 'rest' | 'selected' | 'out'"),
'Stepper': ('Billing', 72, "h('div',{className:'gl-stage'},h('div',{style:{width:150}},h(G.Stepper,{value:2})))",
 """A −/+ control that changes a dish count after the first ADD.

- Going below 1 removes the item from the bill.
- The buttons are 44px wide even though the bar is 36px tall.""",
 "value?: number"),
'VegMark': ('Billing', 64, "h('div',{className:'gl-stage'},h(G.VegMark,null),h(G.VegMark,{type:'nonveg'}))",
 """The Indian food mark: a green square with a dot for veg, red for non-veg.

- Use `food-veg` and `food-non-veg` only; never recolour it to match a theme.
- It carries an accessible label ("Veg", "Non-veg"), so colour is not the only signal.""",
 "type?: 'veg' | 'nonveg'"),
'CartBar': ('Billing', 88, "h('div',{className:'gl-stage'},h(G.CartBar,{items:3,total:220}),h(G.CartBar,{items:2,total:540,cta:'Settle'}))",
 """The bar pinned above the tab bar once a bill has items, showing the count and total.

- Counter: "View bill ›". Table: "Settle ›".
- It appears with the first item and hides when the bill is empty.""",
 "items?: number; total?: number; cta?: string"),
'BillSummary': ('Billing', 330, "h('div',{className:'gl-stage'},h(G.BillSummary,{title:'Bill · Token #42',lines:[{qty:2,name:'Masala Dosa',price:90},{qty:1,name:'Vada',price:40}],discount:20}))",
 """The bill inside the bill sheet: items, subtotal, discount, GST and total.

- Discounts come before GST and show in `status-success` with a minus sign.
- GST shows the rate and says CGST + SGST; delivery-app orders show no GST line.
- The total uses `title-md` with tabular numbers.""",
 "title?: string; lines: { qty: number; name: string; price: number }[]; discount?: number; gstRate?: number"),
'UpiQrCard': ('Billing', 470, "h('div',{className:'gl-stage'},h(G.UpiQrCard,{amount:231}),h(G.UpiQrCard,{amount:231,paid:true}))",
 """The UPI QR screen: the restaurant's name, the exact amount, and a QR any UPI app can scan.

- The amount is inside the QR, so the customer never types it. Say so in plain words under the amount.
- The QR always sits on white with dark ink, in both themes; scanners need that contrast.
- After the cashier confirms, the button turns to "Payment received" in `status-success`.
- The preview QR is a placeholder pattern; the app draws a real one from the UPI ID.""",
 "amount: number; shop?: string; paid?: boolean"),
'TableTile': ('Tables and kitchen', 130, "h('div',{className:'gl-stage'},h(G.TableTile,{name:'T1',status:'busy',amount:640,minutes:25}),h(G.TableTile,{name:'T2'}),h(G.TableTile,{name:'T6',status:'printed',amount:910}))",
 """A table on the floor view: free, busy with a running bill, or bill printed and waiting for payment.

- Busy tables use `bg-brand`; bill-printed tables use turmeric so they stand out for collection.
- Each tile shows the table name and one line of status, never more.""",
 "name: string; status?: 'free' | 'busy' | 'printed'; amount?: number; minutes?: number"),
'PinPad': ('Security', 520, "h('div',{className:'gl-stage',style:{gap:40}},h(G.PinPad,{title:'Owner or manager PIN',subtitle:'Discount ₹50 on Bill T2',filled:2}),h(G.PinPad,{title:'Enter your PIN',subtitle:'Ravi · Cashier',state:'error'}))",
 """The 4-digit PIN pad for signing in and for approvals (discounts, cancellations).

- The subtitle says exactly what is being approved ("Discount ₹50 on Bill T2").
- Dots fill as digits are typed; a wrong PIN turns them `status-danger` with words, and a correct one `status-success`.
- Keys are at least 60px tall. There is no "show PIN" option.""",
 "title?: string; subtitle?: string; filled?: number; state?: 'idle' | 'error' | 'ok'"),
'CashCountResult': ('Day close', 330, "h('div',{className:'gl-stage'},h(G.CashCountResult,{expected:14345,counted:14345,rows:[{label:'Start of day',amount:2000},{label:'+ Cash bills',amount:12545},{label:'− Paid out',amount:200,muted:true}]}),h(G.CashCountResult,{expected:14345,counted:14245,rows:[{label:'Start of day',amount:2000},{label:'+ Cash bills',amount:12545},{label:'− Paid out',amount:200,muted:true}]}))",
 """The day-close result: what should be in the drawer, what was counted, and whether it matches.

- Matches: `status-success` with "✓ Cash matches". Short: `status-danger`, "Short by ₹100". Extra: `status-warning`.
- Cashiers count blind: with `blind`, the expected amount is hidden and no result is shown until a manager or owner closes the day.
- Always show the working (start, cash bills, paid out) so nobody has to trust a single number.""",
 "expected: number; counted?: number; rows?: { label: string; amount: number; muted?: boolean; sign?: string }[]; blind?: boolean"),
'Badge': ('Feedback', 80, "h('div',{className:'gl-stage'},h(G.Badge,{tone:'offline'},'Offline'),h(G.Badge,{tone:'success'},'Paid'),h(G.Badge,{tone:'danger'},'Cancelled'),h(G.Badge,{tone:'warning'},'Unsent items'),h(G.Badge,{tone:'new'},'NEW'),h(G.Badge,{tone:'brand'},'Pro'),h(G.Badge,null,'Cashier'))",
 """A short status label: Offline, Paid, Cancelled, NEW, or a plan or role name.

- One or two words. The word carries the meaning; colour only supports it.
- **offline** is turmeric with a dot, and appears in the app header whenever there is no network: "Offline. Bills are still saved on this phone.\"""",
 "tone?: 'neutral' | 'offline' | 'success' | 'danger' | 'warning' | 'new' | 'brand'; children?: React.ReactNode"),
'Toast': ('Feedback', 200, "h('div',{className:'gl-stack'},h(G.Toast,null,'Saved on phone · Token #42'),h(G.Toast,{tone:'info'},'KOT #12 sent to kitchen'),h(G.Toast,{tone:'danger'},'Printer not found'))",
 """A brief message at the top of the screen after an action finishes.

- Confirm with the result and its reference: "Saved on phone · Token #42", "KOT #12 sent to kitchen".
- Toasts disappear by themselves after about 2 seconds; anything the person must act on is a Banner instead.""",
 "tone?: 'success' | 'info' | 'danger'; children?: React.ReactNode"),
'Banner': ('Feedback', 250, "h('div',{className:'gl-stack'},h(G.Banner,{tone:'info',title:'This is not a tax invoice.'},'Your invoice is given after payment.'),h(G.Banner,{tone:'warning',title:'2 items not sent to the kitchen'},'Send them before settling this table.'),h(G.Banner,{tone:'danger'},'Only GST-registered businesses can charge GST. Add your GSTIN above.'))",
 """An inline message that stays until the situation changes.

- Title states the fact; the second line says what to do.
- Use `danger` only for things that block the next step.""",
 "tone?: 'info' | 'success' | 'warning' | 'danger'; title?: string; children?: React.ReactNode"),
'EmptyState': ('Feedback', 220, "h('div',{className:'gl-stage'},h(G.EmptyState,{title:'No bills yet today',action:'Make a bill'},'Bills you make at the counter show up here.'))",
 """What a list shows before it has anything in it.

- Say what will appear and how to make the first one. No illustrations, no jokes.""",
 "title: string; action?: string; children?: React.ReactNode"),
'Card': ('Surfaces', 150, "h('div',{className:'gl-stage'},h(G.Card,{title:'Receipt printer'},'BTprinter016556 · 58 mm · Connected'),h(G.Card,{title:'You are on Pilot',tone:'brand'},'All features are free during the trial.'))",
 """A card groups one topic on a screen: a setting, a printer, a plan.

- Flat with a `border-default` hairline and `radius-xl`; no shadow inside the app.
- Use `tone="brand"` for at most one highlighted card per screen.""",
 "title?: string; tone?: 'default' | 'brand'; footer?: React.ReactNode; children?: React.ReactNode"),
'ListRow': ('Surfaces', 210, "h('div',{className:'gl-stage',style:{flexDirection:'column',gap:0}},h(G.ListRow,{title:'Ravi',subtitle:'Cashier · PIN set',avatar:true,role:'cashier'}),h(G.ListRow,{title:'Token #42',subtitle:'1:42 PM · UPI',value:'₹231'}),h(G.ListRow,{title:'Export for CA',subtitle:'Bills, GST summary, expenses'}))",
 """A row in a list: staff, bills, settings.

- Title in semibold, one subtitle line in `text-secondary`, optional amount on the right with tabular numbers.
- A chevron means the row opens something; leave it off for rows that do not.""",
 "title: string; subtitle?: string; value?: string; avatar?: boolean; role?: 'owner' | 'manager' | 'cashier'; chevron?: boolean"),
'Avatar': ('Surfaces', 80, "h('div',{className:'gl-stage'},h(G.Avatar,{name:'Owner',role:'owner'}),h(G.Avatar,{name:'Manager',role:'manager'}),h(G.Avatar,{name:'Ravi',role:'cashier'}),h(G.Avatar,{name:'Jasdeep',role:'owner',size:'sm'}))",
 """A person's initial in a circle, coloured by role: owner green, manager turmeric, cashier tint.

- Always pair it with the name in text; the colour alone does not say the role.""",
 "name: string; role?: 'owner' | 'manager' | 'cashier'; size?: 'md' | 'sm'"),
'BottomSheet': ('Surfaces', 460, "h(G.BottomSheet,{title:'Cancel this bill',subtitle:'Token #42 · ₹231. The bill stays on record, struck through.',actions:h(React.Fragment,null,h(G.Button,{variant:'danger',block:true},'Cancel this bill'),h(G.Button,{variant:'text',block:true,size:'md'},'Keep bill'))},h(G.TextField,{label:'Reason',placeholder:'Customer left'}))",
 """The app's one overlay: it slides up from the bottom and closes by swiping down, tapping outside, or Back.

- Every sheet has the handle, a `title-md` title, and at most one primary action plus a text button to back out.
- Opens in `duration-sheet` (260ms) with `ease-enter`; closes in `duration-base` (200ms).
- Never centre a dialog in the middle of the screen; that was a bug we removed.""",
 "title?: string; subtitle?: string; actions?: React.ReactNode; children?: React.ReactNode"),
'AppHeader': ('Navigation', 110, "h('div',{className:'gl-stack',style:{padding:0,maxWidth:'none'}},h(G.AppHeader,{title:'Counter',offline:true,user:'Ravi'}))",
 """The green header on main screens: restaurant name, screen title, the Offline badge when needed, and who is signed in.

- The Offline badge appears only when there is no network, with the label "Offline. Bills are still saved on this phone." for screen readers.""",
 "restaurant?: string; title?: string; offline?: boolean; user?: string"),
'TabBar': ('Navigation', 96, "h('div',{className:'gl-stack',style:{padding:0,maxWidth:'none'}},h(G.TabBar,{active:'Orders',initial:'R'}))",
 """The bottom navigation: Orders, Bills, Insights, Profile. Never more than four tabs.

- Profile shows the person's initial instead of an icon, so staff see who is signed in.
- The active tab gets the indicator bar and `text-link`. Icons are SF Symbols on iPhone and Material Symbols on Android.""",
 "active?: 'Orders' | 'Bills' | 'Insights' | 'Profile'; initial?: string"),
'Receipt': ('Print', 420, """h('div',{className:'gl-stage',style:{gap:24}},h(G.Receipt,{label:'Tax invoice',lines:['         SINGH SWEETS','         MG Road, Pune','    GSTIN 27ABCDE1234F1Z5','     FSSAI 11223344556677','--------------------------------','          TAX INVOICE','Invoice        INV-2627-000123','Token #42          10 Oct 13:42','--------------------------------','Masala Dosa  x2           180.00','Vada         x1            40.00','--------------------------------','Taxable value             220.00','CGST 2.5%                   5.50','SGST 2.5%                   5.50','TOTAL                  Rs 231.00','--------------------------------','Paid by UPI','     Thank you! Visit again.']}),h(G.Receipt,{label:'Kitchen slip',lines:['            KOT #12','       TABLE 4 - 8:42 PM','--------------------------------','NEW ITEMS','+ Butter Naan            x2','+ Dal Makhani            x1','--------------------------------','Note: less spicy','Waiter: Ravi']}))""",
 """An on-screen preview of what prints on the 58 mm Bluetooth printer: bills, kitchen slips, table bills, day close.

- 32 characters per line, plain ASCII only. Amounts print as "Rs", separators as "-"; many cheap printers cannot print ₹ or ·.
- Shop name double size and bold; section titles bold; a line of 32 dashes between parts.
- Tax invoices show GSTIN, FSSAI, a running invoice number INV-<financial year>-<serial>, taxable value, CGST and SGST.
- Kitchen slips show no prices, only new items, notes, and who took the order; removed items print as CANCEL.
- The paper is always white with black text, in both themes.""",
 "lines: string[]; label?: string"),
'NavBar': ('Web', 90, "h(G.NavBar,{active:0})",
 """The top bar of galla's web pages: the owner dashboard and the website.

- Logo with wordmark on the left, up to five links, account on the right.
- The active link uses `bg-selected`. On narrow screens, links move into a menu.""",
 "links?: string[]; active?: number; right?: React.ReactNode"),
'StatTile': ('Web', 150, "h('div',{className:'gl-stage'},h(G.StatTile,{label:'Restaurants on trial',value:'4',delta:'+2'}),h(G.StatTile,{label:'Monthly revenue',value:'₹3,996',delta:'+₹999',period:'vs last month'}),h(G.StatTile,{label:'Open requests',value:'1'}))",
 """A single number with its label and change, for dashboards.

- Label above, value in `amount`, change below with words ("vs last week"), coloured by direction.
- Use at most four in a row.""",
 "label: string; value: string; delta?: string; period?: string"),
'DataTable': ('Web', 240, "h('div',{className:'gl-stack',style:{maxWidth:640}},h(G.DataTable,{columns:[{key:'name',label:'Restaurant'},{key:'plan',label:'Plan'},{key:'status',label:'Status',badge:true},{key:'bills',label:'Bills this week',num:true}],rows:[{name:'Singh Sweets',plan:'Pilot',status:'Trial',bills:'412'},{name:'Cafe Leaf',plan:'Starter',status:'Active',bills:'198'},{name:'Dosa Corner',plan:'Free',status:'Paused',bills:'0'}]}))",
 """A table for web dashboards and exports.

- Numbers right-aligned with tabular figures. Status columns use Badge.
- Wide tables scroll sideways inside their own box, never the whole page.
- Per galla's privacy rule, the owner dashboard never shows a restaurant's sales, only counts and service health.""",
 "columns: { key: string; label: string; num?: boolean; badge?: boolean }[]; rows: Record<string, string>[]"),
'PlanCard': ('Web', 460, "h('div',{className:'gl-stage'},h(G.PlanCard,{name:'Starter',price:499,tagline:'For small counters and cafes',features:['Tables and dine-in','Staff PINs and roles','UPI QR and WhatsApp bills']}),h(G.PlanCard,{name:'Pro',price:999,featured:true,tagline:'For busy restaurants',features:['Everything in Starter','Printed bills and kitchen slips','Zomato and Swiggy orders']}))",
 """A subscription plan on the plan page and the website.

- Name, monthly price in rupees, one-line audience, three to five features, one button.
- Only one plan is featured (`bg-brand` with a "Most popular" flag).
- List only features that are built.""",
 "name: string; price: number; tagline?: string; features?: string[]; featured?: boolean; cta?: string"),
'ApprovalRow': ('Web', 170, "h('div',{className:'gl-stack',style:{maxWidth:600}},h(G.ApprovalRow,{restaurant:'Singh Sweets',plan:'Pro',utr:'412345678901',amount:999,when:'2 min ago'}),h(G.ApprovalRow,{restaurant:'Cafe Leaf',plan:'Starter',utr:'398877665544',amount:499,when:'Yesterday',state:'approved'}))",
 """A plan request in the owner dashboard: who, which plan, the UPI reference and amount, with Approve and Decline.

- Check the UPI reference against your bank before approving; the plan switches on in the restaurant's app.
- After a decision, the buttons are replaced by a Badge saying what happened.""",
 "restaurant: string; plan: string; utr: string; amount: number; when: string; state?: 'pending' | 'approved' | 'declined'"),
'SalesChart': ('Web', 290, "h('div',{className:'gl-stage'},h(G.SalesChart,{title:'Sales this week',data:[{label:'Mon',value:14200},{label:'Tue',value:12800},{label:'Wed',value:15100},{label:'Thu',value:13900},{label:'Fri',value:18400},{label:'Sat',value:22300,highlight:true},{label:'Sun',value:20100}]}))",
 """A simple bar chart for sales over days or weeks.

- Bars in `action-primary`; highlight one bar (the best day) in `action-accent`.
- Axis labels in `text-secondary`, a faint `border-default` grid, values rounded to thousands.
- One series per chart. Say the takeaway in a title or caption.""",
 "title?: string; data: { label: string; value: number; highlight?: boolean }[]"),
}
order = list(C.keys())
dts = ["import type * as React from 'react';"]
for name in order:
    group, height, expr, readme, props = C[name]
    d = os.path.join(ROOT, name); os.makedirs(d, exist_ok=True)
    first = readme.split('\n')[0]
    open(os.path.join(d, 'README.md'), 'w').write(f"# {name}\n\n{readme}\n")
    html = f"""<!-- @dsCard group="{group}" height={height} -->
<!doctype html>
<html lang="en">
<head><meta charset="utf-8"><title>{name} — preview</title></head>
<body>
<div id="root"></div>
<script>
  var G = window.Galla, h = React.createElement;
  ReactDOM.createRoot(document.getElementById('root')).render({expr});
</script>
</body>
</html>
"""
    open(os.path.join(d, 'preview.html'), 'w').write(html)
    dts.append(f"/** {first} */\nexport interface {name}Props {{ {props} }}\nexport declare function {name}(props: {name}Props): React.ReactElement;")
dts.append("declare global { interface Window { Galla: { " + "; ".join(f"{n}: typeof {n}" for n in order) + " } } }")
open(os.path.join(ROOT, 'index.d.ts'), 'w').write("\n".join(dts) + "\n")
print(len(order), 'components')
