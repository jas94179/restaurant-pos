import type * as React from 'react';
/** The coin-in-the-cash-box mark, used as the app icon and next to the wordmark. */
export interface LogoProps { size?: number; wordmark?: boolean }
export declare function Logo(props: LogoProps): React.ReactElement;
/** Buttons start the main action on a screen. Labels are short verbs in sentence case: "Send to kitchen", "Print test page". */
export interface ButtonProps { variant?: 'primary' | 'accent' | 'secondary' | 'danger' | 'success' | 'text'; size?: 'lg' | 'md' | 'sm'; block?: boolean; loading?: boolean; disabled?: boolean; onClick?: () => void; children?: React.ReactNode }
export declare function Button(props: ButtonProps): React.ReactElement;
/** A back link at the top of a sub-screen, written as "‹ Profile" with the name of the screen it returns to. */
export interface BackLinkProps { href?: string; children?: React.ReactNode }
export declare function BackLink(props: BackLinkProps): React.ReactElement;
/** Chips filter a list (menu categories, report periods) or add quick choices (kitchen notes, discount reasons). */
export interface ChipProps { selected?: boolean; tone?: 'outline' | 'solid'; onClick?: () => void; children?: React.ReactNode }
export declare function Chip(props: ChipProps): React.ReactElement;
/** A segmented control picks one of 2–4 options that are all visible at once, such as payment mode or order type. */
export interface SegmentedProps { options: string[]; value?: string; label?: string; onChange?: (value: string) => void }
export declare function Segmented(props: SegmentedProps): React.ReactElement;
/** Pill tabs switch between two or three views of the same thing, such as Terms of use and Privacy notice. */
export interface TabsProps { tabs: string[]; value?: string }
export declare function Tabs(props: TabsProps): React.ReactElement;
/** A switch turns a setting on or off right away, with no save button. */
export interface SwitchProps { label: string; hint?: string; checked?: boolean }
export declare function Switch(props: SwitchProps): React.ReactElement;
/** Checkboxes collect agreement, such as the three required ticks at sign-up. */
export interface CheckboxProps { label: string; checked?: boolean; required?: boolean }
export declare function Checkbox(props: CheckboxProps): React.ReactElement;
/** A text field takes one line of input with a label above it. */
export interface TextFieldProps { label?: string; value?: string; placeholder?: string; hint?: string; error?: string; prefix?: string; inputMode?: string; disabled?: boolean }
export declare function TextField(props: TextFieldProps): React.ReactElement;
/** The search box at the top of the counter menu and bills list. */
export interface SearchFieldProps { placeholder?: string; value?: string }
export declare function SearchField(props: SearchFieldProps): React.ReactElement;
/** A dish on the counter menu: tap ADD, then use the stepper to change the count. */
export interface DishTileProps { name: string; price: number; veg?: boolean; qty?: number; state?: 'rest' | 'selected' | 'out' }
export declare function DishTile(props: DishTileProps): React.ReactElement;
/** A −/+ control that changes a dish count after the first ADD. */
export interface StepperProps { value?: number }
export declare function Stepper(props: StepperProps): React.ReactElement;
/** The Indian food mark: a green square with a dot for veg, red for non-veg. */
export interface VegMarkProps { type?: 'veg' | 'nonveg' }
export declare function VegMark(props: VegMarkProps): React.ReactElement;
/** The bar pinned above the tab bar once a bill has items, showing the count and total. */
export interface CartBarProps { items?: number; total?: number; cta?: string }
export declare function CartBar(props: CartBarProps): React.ReactElement;
/** The bill inside the bill sheet: items, subtotal, discount, GST and total. */
export interface BillSummaryProps { title?: string; lines: { qty: number; name: string; price: number }[]; discount?: number; gstRate?: number }
export declare function BillSummary(props: BillSummaryProps): React.ReactElement;
/** The UPI QR screen: the restaurant's name, the exact amount, and a QR any UPI app can scan. */
export interface UpiQrCardProps { amount: number; shop?: string; paid?: boolean }
export declare function UpiQrCard(props: UpiQrCardProps): React.ReactElement;
/** A table on the floor view: free, busy with a running bill, or bill printed and waiting for payment. */
export interface TableTileProps { name: string; status?: 'free' | 'busy' | 'printed'; amount?: number; minutes?: number }
export declare function TableTile(props: TableTileProps): React.ReactElement;
/** The 4-digit PIN pad for signing in and for approvals (discounts, cancellations). */
export interface PinPadProps { title?: string; subtitle?: string; filled?: number; state?: 'idle' | 'error' | 'ok' }
export declare function PinPad(props: PinPadProps): React.ReactElement;
/** The day-close result: what should be in the drawer, what was counted, and whether it matches. */
export interface CashCountResultProps { expected: number; counted?: number; rows?: { label: string; amount: number; muted?: boolean; sign?: string }[]; blind?: boolean }
export declare function CashCountResult(props: CashCountResultProps): React.ReactElement;
/** A short status label: Offline, Paid, Cancelled, NEW, or a plan or role name. */
export interface BadgeProps { tone?: 'neutral' | 'offline' | 'success' | 'danger' | 'warning' | 'new' | 'brand'; children?: React.ReactNode }
export declare function Badge(props: BadgeProps): React.ReactElement;
/** A brief message at the top of the screen after an action finishes. */
export interface ToastProps { tone?: 'success' | 'info' | 'danger'; children?: React.ReactNode }
export declare function Toast(props: ToastProps): React.ReactElement;
/** An inline message that stays until the situation changes. */
export interface BannerProps { tone?: 'info' | 'success' | 'warning' | 'danger'; title?: string; children?: React.ReactNode }
export declare function Banner(props: BannerProps): React.ReactElement;
/** What a list shows before it has anything in it. */
export interface EmptyStateProps { title: string; action?: string; children?: React.ReactNode }
export declare function EmptyState(props: EmptyStateProps): React.ReactElement;
/** A card groups one topic on a screen: a setting, a printer, a plan. */
export interface CardProps { title?: string; tone?: 'default' | 'brand'; footer?: React.ReactNode; children?: React.ReactNode }
export declare function Card(props: CardProps): React.ReactElement;
/** A row in a list: staff, bills, settings. */
export interface ListRowProps { title: string; subtitle?: string; value?: string; avatar?: boolean; role?: 'owner' | 'manager' | 'cashier'; chevron?: boolean }
export declare function ListRow(props: ListRowProps): React.ReactElement;
/** A person's initial in a circle, coloured by role: owner green, manager turmeric, cashier tint. */
export interface AvatarProps { name: string; role?: 'owner' | 'manager' | 'cashier'; size?: 'md' | 'sm' }
export declare function Avatar(props: AvatarProps): React.ReactElement;
/** The app's one overlay: it slides up from the bottom and closes by swiping down, tapping outside, or Back. */
export interface BottomSheetProps { title?: string; subtitle?: string; actions?: React.ReactNode; children?: React.ReactNode }
export declare function BottomSheet(props: BottomSheetProps): React.ReactElement;
/** The green header on main screens: restaurant name, screen title, the Offline badge when needed, and who is signed in. */
export interface AppHeaderProps { restaurant?: string; title?: string; offline?: boolean; user?: string }
export declare function AppHeader(props: AppHeaderProps): React.ReactElement;
/** The bottom navigation: Orders, Bills, Insights, Profile. Never more than four tabs. */
export interface TabBarProps { active?: 'Orders' | 'Bills' | 'Insights' | 'Profile'; initial?: string }
export declare function TabBar(props: TabBarProps): React.ReactElement;
/** An on-screen preview of what prints on the 58 mm Bluetooth printer: bills, kitchen slips, table bills, day close. */
export interface ReceiptProps { lines: string[]; label?: string }
export declare function Receipt(props: ReceiptProps): React.ReactElement;
/** The top bar of galla's web pages: the owner dashboard and the website. */
export interface NavBarProps { links?: string[]; active?: number; right?: React.ReactNode }
export declare function NavBar(props: NavBarProps): React.ReactElement;
/** A single number with its label and change, for dashboards. */
export interface StatTileProps { label: string; value: string; delta?: string; period?: string }
export declare function StatTile(props: StatTileProps): React.ReactElement;
/** A table for web dashboards and exports. */
export interface DataTableProps { columns: { key: string; label: string; num?: boolean; badge?: boolean }[]; rows: Record<string, string>[] }
export declare function DataTable(props: DataTableProps): React.ReactElement;
/** A subscription plan on the plan page and the website. */
export interface PlanCardProps { name: string; price: number; tagline?: string; features?: string[]; featured?: boolean; cta?: string }
export declare function PlanCard(props: PlanCardProps): React.ReactElement;
/** A plan request in the owner dashboard: who, which plan, the UPI reference and amount, with Approve and Decline. */
export interface ApprovalRowProps { restaurant: string; plan: string; utr: string; amount: number; when: string; state?: 'pending' | 'approved' | 'declined' }
export declare function ApprovalRow(props: ApprovalRowProps): React.ReactElement;
/** A simple bar chart for sales over days or weeks. */
export interface SalesChartProps { title?: string; data: { label: string; value: number; highlight?: boolean }[] }
export declare function SalesChart(props: SalesChartProps): React.ReactElement;
declare global { interface Window { Galla: { Logo: typeof Logo; Button: typeof Button; BackLink: typeof BackLink; Chip: typeof Chip; Segmented: typeof Segmented; Tabs: typeof Tabs; Switch: typeof Switch; Checkbox: typeof Checkbox; TextField: typeof TextField; SearchField: typeof SearchField; DishTile: typeof DishTile; Stepper: typeof Stepper; VegMark: typeof VegMark; CartBar: typeof CartBar; BillSummary: typeof BillSummary; UpiQrCard: typeof UpiQrCard; TableTile: typeof TableTile; PinPad: typeof PinPad; CashCountResult: typeof CashCountResult; Badge: typeof Badge; Toast: typeof Toast; Banner: typeof Banner; EmptyState: typeof EmptyState; Card: typeof Card; ListRow: typeof ListRow; Avatar: typeof Avatar; BottomSheet: typeof BottomSheet; AppHeader: typeof AppHeader; TabBar: typeof TabBar; Receipt: typeof Receipt; NavBar: typeof NavBar; StatTile: typeof StatTile; DataTable: typeof DataTable; PlanCard: typeof PlanCard; ApprovalRow: typeof ApprovalRow; SalesChart: typeof SalesChart } } }
