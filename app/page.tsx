"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowRight, Bookmark, Check, ChevronLeft, ChevronRight, Flame,
  Heart, Menu, Moon, Plus, Search, ShoppingBag, Sparkles, Sun,
  Trash2, UserRound, Utensils, X, Zap
} from "lucide-react";
import { macroForSelection, macroTotal, menuItems, restaurants, type Macro, type MenuItem } from "../lib/data";
import { cn } from "@/lib/utils";

type Selected = { item: MenuItem; quantity: number };
type View = "home" | "restaurant" | "picks";
type MacroPickGoal = "High Protein" | "Low Calorie" | "Low Carb" | "Bulking" | "Best Protein / Calorie";
type MacroPickItem = { id: string; quantity?: number };
type MacroPick = { title: string; restaurantId: string; goal: MacroPickGoal; description: string; items: MacroPickItem[]; why: string };
type MealChoice = { name: string; description: string; baseIds?: string[]; groupLabels?: string[] };
type BuilderGroup = { label: string; help: string; categories: string[]; variant?: "kids" | "extras"; showWhen?: string[] };
type BuilderConfig = { meals: MealChoice[]; groups: BuilderGroup[]; tip: string };
const portionMultipliers = { Light: .8, Normal: 1, Heavy: 1.25 };
const jerseyMikesSizes = [
  { label: "Mini", value: .58, description: "Smaller sub" },
  { label: "Regular", value: 1, description: "Standard size" },
  { label: "Giant", value: 2, description: "Double regular" },
] as const;
const subwaySizes = [
  { label: "6-inch", value: 1, description: "Standard sub portion" },
  { label: "Footlong", value: 2, description: "Double 6-inch macros" },
] as const;
const starbucksSizes = [
  { label: "Tall", value: .75, description: "12 fl oz" },
  { label: "Grande", value: 1, description: "16 fl oz" },
  { label: "Venti", value: 1.25, description: "20-24 fl oz" },
] as const;
const itemSizeOptions = [
  { label: "Small", value: .7 },
  { label: "Medium", value: 1 },
  { label: "Large", value: 1.35 },
] as const;
const starbucksSizedCategories = ["Coffee", "Espresso", "Refreshers", "Tea & Matcha", "Frappuccino", "Customizations"];
const subwaySizedCategories = ["Bread", "Sandwiches", "Meats", "Cheese", "Toppings", "Sauces"];
const quantityCategories = [
  "Entrees", "Sandwiches", "Breakfast", "Food", "Desserts", "Sauces",
  "Burgers", "Chicken & Fish", "McCafe", "Coffee", "Espresso", "Refreshers",
  "Tea & Matcha", "Frappuccino", "Frozen Custard", "Salads & Soup",
  "Taco Bell Bases", "Proteins", "Add Extras", "Patties", "Chicken", "Shakes",
  "Shake Mix-ins", "Blizzards", "Mains", "Dips", "Dressings", "Curated Bowls",
  "Hot Dogs", "Beef & Sausage", "Add Ons", "Dessert", "Salads", "Drinks"
];
const round = (number: number) => Math.round(number);
const officialBaselineRestaurants = new Set(["panda", "jimmyjohns", "culvers", "subway", "fiveguys", "shakeshack", "dairyqueen", "cava", "portillos"]);
const featuredSearches = ["Beef sandwich", "Blizzard", "Iced coffee", "Chicken nuggets", "Footlong sub", "Bowl"];
const homeCollections = [
  { label: "Build-your-own", description: "Bowls, subs, tacos & more", ids: ["chipotle", "subway", "jerseymikes", "tacobell"] },
  { label: "Burger joints", description: "Fresh beef, flame-grilled, shaken", ids: ["wendys", "burgerking", "fiveguys", "shakeshack"] },
  { label: "Chicken spots", description: "Tenders, sandwiches & wings", ids: ["chickfila", "popeyes", "raisingcanes", "wingstop"] },
  { label: "Coffee and drinks", description: "Coffee, refreshers & shakes", ids: ["starbucks", "dairyqueen", "portillos", "arbys"] },
] as const;
const macroPickGoals: MacroPickGoal[] = ["High Protein", "Low Calorie", "Low Carb", "Bulking", "Best Protein / Calorie"];
const macroPicks: MacroPick[] = [
  { title: "Double Chicken Lean Bowl", restaurantId: "chipotle", goal: "High Protein", description: "Chicken, extra chicken, fajita veggies, black beans, tomato salsa, and lettuce.", items: [{ id: "chip-chicken", quantity: 2 }, { id: "chip-fajita" }, { id: "chip-black-beans" }, { id: "chip-tomato" }, { id: "chip-lettuce" }], why: "A lot of protein without rice, cheese, sour cream, or guac pushing calories up." },
  { title: "Chicken Rice Training Bowl", restaurantId: "chipotle", goal: "Bulking", description: "Chicken, white rice, black beans, corn salsa, cheese, and guac.", items: [{ id: "chip-chicken" }, { id: "chip-white-rice" }, { id: "chip-black-beans" }, { id: "chip-corn" }, { id: "chip-cheese" }, { id: "chip-guac" }], why: "A higher-calorie bowl with balanced carbs, fats, and a strong protein base." },
  { title: "Teriyaki Greens Plate", restaurantId: "panda", goal: "Best Protein / Calorie", description: "Grilled teriyaki chicken with Super Greens.", items: [{ id: "teriyaki" }, { id: "super-greens" }], why: "One of the cleanest Panda combos for protein while keeping calories controlled." },
  { title: "Grilled Nuggets + Fruit", restaurantId: "chickfila", goal: "High Protein", description: "12-count grilled nuggets, fruit cup, buffalo sauce, and unsweet tea.", items: [{ id: "cfa-nuggets" }, { id: "cfa-fruit" }, { id: "cfa-bbq" }, { id: "cfa-tea" }], why: "Very high protein, low fat, and easy to keep light." },
  { title: "McDouble No Bun", restaurantId: "mcdonalds", goal: "Low Carb", description: "McDouble with no bun and extra pickles.", items: [{ id: "mcd-mcdouble" }, { id: "mcd-no-bun" }, { id: "mcd-extra-pickles" }], why: "Keeps the burger protein and fat while cutting most of the carbs from the bun." },
  { title: "Turkey Bacon Coffee Run", restaurantId: "starbucks", goal: "Low Calorie", description: "Turkey bacon egg white sandwich with unsweetened iced coffee.", items: [{ id: "star-turkey-bacon" }, { id: "star-iced-coffee" }], why: "A simple breakfast pick with protein and almost no drink calories." },
  { title: "Subway Turkey Protein Build", restaurantId: "subway", goal: "High Protein", description: "Wheat bread, turkey, provolone, spinach, cucumber, tomato, and mustard.", items: [{ id: "sub-wheat" }, { id: "sub-turkey-meat", quantity: 2 }, { id: "sub-provolone" }, { id: "sub-spinach" }, { id: "sub-cucumbers" }, { id: "sub-tomatoes" }, { id: "sub-yellow-mustard" }], why: "A classic lean sub pattern that keeps sauces light and protein solid." },
  { title: "CAVA Steak Greens Bowl", restaurantId: "cava", goal: "Low Carb", description: "SuperGreens, grilled steak, tzatziki, feta, cucumber, pickled onions, and skhug.", items: [{ id: "cava-supergreens" }, { id: "cava-steak" }, { id: "cava-tzatziki" }, { id: "cava-feta" }, { id: "cava-cucumber" }, { id: "cava-pickled-onions" }, { id: "cava-skhug" }], why: "A lower-carb bowl with steak protein and flavorful toppings." },
  { title: "Portillo's Beef Bowl", restaurantId: "portillos", goal: "Low Carb", description: "Italian Beef Bowl with sweet peppers.", items: [{ id: "portillo-beef-bowl" }, { id: "portillo-sweet-peppers" }], why: "Portillo's flavor without the bread, fries, or shake calories." },
  { title: "DQ Grilled Chicken Salad", restaurantId: "dairyqueen", goal: "High Protein", description: "Grilled Chicken BLT Salad with a lighter sauce choice.", items: [{ id: "dq-grilled-chicken-salad" }, { id: "dq-bbq-sauce" }], why: "A higher-protein DQ pick that avoids the heavier burger and Blizzard route." },
  { title: "Dave's Single + Chili", restaurantId: "wendys", goal: "High Protein", description: "Dave's Single with a small chili on the side.", items: [{ id: "wen-daves-single" }, { id: "wen-chili" }], why: "The chili adds a second protein hit with minimal fat — a solid two-item Wendy's combo." },
  { title: "Grilled Chicken + Baked Potato", restaurantId: "wendys", goal: "Low Calorie", description: "Grilled chicken sandwich with a plain baked potato instead of fries.", items: [{ id: "wen-grilled-chicken" }, { id: "wen-baked-potato" }], why: "Swapping fries for a baked potato cuts fat significantly while keeping you full." },
  { title: "Whopper Jr. + No Fries", restaurantId: "burgerking", goal: "Low Calorie", description: "Whopper Jr. as the only item — flame-grilled and portion-controlled.", items: [{ id: "bk-whopper-jr" }], why: "The smallest flame-grilled beef option at BK. Skip the fries and it's a reasonable calorie day." },
  { title: "Royal Crispy Protein Run", restaurantId: "burgerking", goal: "High Protein", description: "Royal Crispy Chicken Sandwich with onion rings.", items: [{ id: "bk-royal-crispy" }, { id: "bk-onion-rings" }], why: "The Royal Crispy delivers 31g protein in BK's current flagship chicken sandwich." },
  { title: "Panera Caesar Chicken", restaurantId: "panera", goal: "Low Carb", description: "Caesar salad with chicken — no croutons.", items: [{ id: "pan-caesar-salad" }], why: "Without the croutons you get 40g protein and under 10g net carbs from a sit-down-quality salad." },
  { title: "Turkey Bravo + Tomato Soup", restaurantId: "panera", goal: "Best Protein / Calorie", description: "Bacon Turkey Bravo with a cup of creamy tomato soup.", items: [{ id: "pan-bacon-turkey-bravo" }, { id: "pan-tomato-soup" }], why: "High protein sandwich paired with a light soup — solid ratio for the calorie spend." },
  { title: "Popeyes Breast + Green Beans", restaurantId: "popeyes", goal: "High Protein", description: "Bone-in chicken breast with green beans.", items: [{ id: "pop-breast-mild" }, { id: "pop-green-beans" }], why: "37g protein in the breast alone. Pairing with green beans keeps the total meal under 450 calories." },
  { title: "3 PC Tenders + Red Beans", restaurantId: "popeyes", goal: "Best Protein / Calorie", description: "3 PC tenders with red beans and rice.", items: [{ id: "pop-tenders-3" }, { id: "pop-red-beans-rice" }], why: "Tenders are the cleanest protein option at Popeyes. Red beans add carbs and fiber without spiking fat." },
  { title: "Classic Roast Beef + Curly Fries", restaurantId: "arbys", goal: "Best Protein / Calorie", description: "Classic roast beef sandwich with a small curly fries.", items: [{ id: "arb-classic-roast-beef" }, { id: "arb-curly-fries" }], why: "Roast beef is leaner than most fast food beef. You get 23g protein in a single sandwich under 400 calories." },
  { title: "Roast Chicken + Curly Fries", restaurantId: "arbys", goal: "Low Calorie", description: "Roast chicken sandwich with a small curly fries.", items: [{ id: "arb-roast-chicken" }, { id: "arb-curly-fries" }], why: "Sliced roast chicken is one of the leanest sandwiches in fast food — 32g protein, only 13g fat." },
  { title: "Original Hot Wings Haul", restaurantId: "wingstop", goal: "High Protein", description: "10 classic Original Hot wings with veggie sticks.", items: [{ id: "ws-classic-original-hot", quantity: 2 }, { id: "ws-veggie-sticks" }], why: "Original Hot has zero carbs and about 72g protein for 10 wings. Veggie sticks add almost nothing calorie-wise." },
  { title: "Lemon Pepper Classic Wings", restaurantId: "wingstop", goal: "Bulking", description: "10 classic Lemon Pepper wings with seasoned fries.", items: [{ id: "ws-classic-lemon-pepper", quantity: 2 }, { id: "ws-seasoned-fries" }], why: "A calorie-dense combo with strong protein. Lemon pepper dry rub adds fat via butter but tastes incredible." },
  { title: "3 Fingers + Crinkle Fries", restaurantId: "raisingcanes", goal: "Best Protein / Calorie", description: "3 chicken fingers with crinkle cut fries and Cane's sauce.", items: [{ id: "rc-chicken-finger", quantity: 3 }, { id: "rc-crinkle-fries" }, { id: "rc-canes-sauce" }], why: "Cane's fingers are some of the cleanest fast food chicken around. 36g protein with a manageable calorie load." },
  { title: "Fingers No Sauce", restaurantId: "raisingcanes", goal: "Low Fat", description: "4 chicken fingers with no sauce or sides.", items: [{ id: "rc-chicken-finger", quantity: 4 }], why: "The fingers alone are low fat. Cane's sauce adds 18g fat per oz — skipping it keeps this very lean." },
];

function Logo({ id, small = false }: { id: string; small?: boolean }) {
  const restaurant = restaurants.find(r => r.id === id)!;
  const [loaded, setLoaded] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    if (imgRef.current?.complete && imgRef.current.naturalWidth > 0) {
      setLoaded(true);
    }
  }, []);

  return (
    <span
      className={cn("brand-logo", small && "brand-logo-small", loaded && "brand-logo-loaded")}
      style={{ background: restaurant.color }}
    >
      <img
        ref={imgRef}
        src={restaurant.logoUrl}
        alt={`${restaurant.name} logo`}
        loading="lazy"
        onLoad={() => setLoaded(true)}
        onError={() => setLoaded(false)}
      />
      <b>{restaurant.short}</b>
      <small>{restaurant.logo}</small>
    </span>
  );
}

function MacroStats({ macro, multiplier = 1 }: { macro: Macro; multiplier?: number }) {
  return (
    <div className="flex gap-0 mt-[13px] py-[10px] border-t border-b border-line">
      <span className="w-1/4 flex flex-col gap-[2px]"><b className="text-[13px]">{round(macro.calories * multiplier)}</b><small className="text-[#96a19c] text-[8px] uppercase tracking-[0.04em]">cal</small></span>
      <span className="w-1/4 flex flex-col gap-[2px]"><b className="text-[13px]">{round(macro.protein * multiplier)}g</b><small className="text-[#96a19c] text-[8px] uppercase tracking-[0.04em]">protein</small></span>
      <span className="w-1/4 flex flex-col gap-[2px]"><b className="text-[13px]">{round(macro.carbs * multiplier)}g</b><small className="text-[#96a19c] text-[8px] uppercase tracking-[0.04em]">carbs</small></span>
      <span className="w-1/4 flex flex-col gap-[2px]"><b className="text-[13px]">{round(macro.fat * multiplier)}g</b><small className="text-[#96a19c] text-[8px] uppercase tracking-[0.04em]">fat</small></span>
    </div>
  );
}

export default function Home() {
  const [view, setView] = useState<View>("home");
  const [restaurantId, setRestaurantId] = useState("panda");
  const [selected, setSelected] = useState<Selected[]>([
    { item: menuItems[1], quantity: 1 }, { item: menuItems[2], quantity: 1 }
  ]);
  const [search, setSearch] = useState("");
  const [portion, setPortion] = useState<keyof typeof portionMultipliers>("Normal");
  const [dark, setDark] = useState(false);
  const [drawer, setDrawer] = useState(false);
  const [saved, setSaved] = useState(false);
  const [orderType, setOrderType] = useState<string | null>(null);
  const [jerseySize, setJerseySize] = useState<(typeof jerseyMikesSizes)[number]["label"]>("Regular");
  const [subwaySize, setSubwaySize] = useState<(typeof subwaySizes)[number]["label"]>("6-inch");
  const [starbucksSize, setStarbucksSize] = useState<(typeof starbucksSizes)[number]["label"]>("Grande");
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const restaurant = restaurants.find(item => item.id === restaurantId)!;
  const multiplier = portionMultipliers[portion];

  const jerseySizeMultiplier = restaurantId === "jerseymikes" ? jerseyMikesSizes.find(size => size.label === jerseySize)!.value : 1;
  const subwaySizeMultiplier = restaurantId === "subway" ? subwaySizes.find(size => size.label === subwaySize)!.value : 1;
  const starbucksSizeMultiplier = restaurantId === "starbucks" ? starbucksSizes.find(size => size.label === starbucksSize)!.value : 1;
  const totals = useMemo(() => macroTotal(selected.map(({ item, quantity }) => ({
    item,
    quantity,
    multiplier: multiplier * (item.restaurantId === "jerseymikes" ? jerseySizeMultiplier : 1) * (item.restaurantId === "subway" && subwaySizedCategories.includes(item.category) ? subwaySizeMultiplier : 1) * (item.restaurantId === "starbucks" && starbucksSizedCategories.includes(item.category) ? starbucksSizeMultiplier : 1),
  }))), [selected, multiplier, jerseySizeMultiplier, subwaySizeMultiplier, starbucksSizeMultiplier]);
  const normalizedSearch = search.trim().toLowerCase();
  const shownRestaurants = restaurants.filter(item => {
    if (!normalizedSearch) return false;
    return [item.name, item.category, item.description, ...item.tags].join(" ").toLowerCase().includes(normalizedSearch);
  }).slice(0, 6);
  const shownItems = menuItems.filter(item => {
    if (!normalizedSearch) return false;
    const restaurantName = restaurants.find(restaurant => restaurant.id === item.restaurantId)?.name ?? "";
    return [item.name, item.category, item.description, item.serving, restaurantName].join(" ").toLowerCase().includes(normalizedSearch);
  }).slice(0, 6);
  const openFirstSearchResult = () => {
    const firstRestaurant = shownRestaurants[0] ?? (shownItems[0] ? restaurants.find(item => item.id === shownItems[0].restaurantId) : undefined);
    if (firstRestaurant) openRestaurant(firstRestaurant.id);
  };

  const openRestaurant = (id: string) => {
    setRestaurantId(id); setView("restaurant"); setSearch("");
    setSelected([]); setOrderType(null); setJerseySize("Regular"); setSubwaySize("6-inch"); setStarbucksSize("Grande"); window.scrollTo({ top: 0, behavior: "smooth" });
  };
  const loadMacroPick = (pick: MacroPick) => {
    setRestaurantId(pick.restaurantId); setView("restaurant"); setSearch("");
    setSelected(pick.items.map(row => ({ item: menuItems.find(item => item.id === row.id)!, quantity: row.quantity ?? 1 })));
    setOrderType(null); setJerseySize("Regular"); setSubwaySize("6-inch"); setStarbucksSize("Grande"); window.scrollTo({ top: 0, behavior: "smooth" });
  };
  const addItem = (item: MenuItem) => setSelected(current => current.some(row => row.item.id === item.id) ? current : [...current, { item, quantity: 1 }]);
  const removeItem = (id: string) => setSelected(current => current.filter(row => row.item.id !== id));
  const updateQuantity = (id: string, quantity: number) => quantity <= 0 ? removeItem(id) : setSelected(current => current.some(row => row.item.id === id) ? current.map(row => row.item.id === id ? { ...row, quantity } : row) : [...current, { item: menuItems.find(item => item.id === id)!, quantity }]);

  return (
    <main className={cn("min-h-screen bg-bg transition-all duration-300", dark && "dark")}>
      {/* Site Header */}
      <header className="h-[70px] bg-white/[0.88] dark:bg-[#111a17]/90 backdrop-blur-[18px] border-b border-line dark:border-[#2c3a35] sticky top-0 z-20">
        <div className="w-[min(1180px,calc(100%-44px))] mx-auto h-full flex items-center gap-[46px]">
          <button
            className="flex items-center gap-2 font-display font-extrabold text-[19px]"
            onClick={() => { setView("home"); setMobileNavOpen(false); }}
          >
            <span className="grid place-items-center w-[31px] h-[31px] text-white bg-green rounded-[10px]">
              <Flame size={17} fill="currentColor" />
            </span>
            MacroMenu
          </button>

          {/* Desktop Nav */}
          <nav className="hidden md:flex gap-[26px] text-sm text-[#53635b] dark:text-[#9eada6]">
            <button
              className={cn("hover:text-green", view === "home" && "text-green font-extrabold")}
              onClick={() => setView("home")}
            >
              Explore
            </button>
            <button
              className={cn("hover:text-green", view === "picks" && "text-green font-extrabold")}
              onClick={() => setView("picks")}
            >
              Macro Picks
            </button>
            <button className="hover:text-green">Saved meals</button>
            <button className="hover:text-green">Favorites</button>
          </nav>

          {/* Desktop Actions */}
          <div className="ml-auto flex gap-[10px] items-center">
            <button
              className="h-[38px] w-[38px] border border-line dark:border-[#2c3a35] rounded-[10px] flex items-center justify-center p-0 dark:bg-[#18231f]"
              onClick={() => setDark(!dark)}
              aria-label="Toggle dark mode"
            >
              {dark ? <Sun size={17} /> : <Moon size={17} />}
            </button>
            <button className="hidden md:flex h-[38px] border border-line dark:border-[#2c3a35] rounded-[10px] items-center gap-[7px] px-3 font-bold text-[13px] dark:bg-[#18231f]">
              <UserRound size={16} /> Log in
            </button>
            <button className="hidden md:flex h-[39px] bg-green text-white px-4 rounded-[10px] font-bold text-[13px] items-center">
              Get started
            </button>
            {/* Hamburger */}
            <button
              className="md:hidden flex flex-col justify-center items-center gap-[5px] w-[38px] h-[38px] border border-line dark:border-[#2c3a35] rounded-[10px] bg-white dark:bg-[#18231f] flex-shrink-0 cursor-pointer"
              onClick={() => setMobileNavOpen(!mobileNavOpen)}
              aria-label="Toggle mobile navigation"
            >
              {mobileNavOpen ? <X size={16} /> : <Menu size={16} />}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Nav Overlay */}
      {mobileNavOpen && (
        <div className="fixed top-16 left-0 right-0 bottom-0 z-[99] bg-bg dark:bg-[#111a17] border-t border-line dark:border-[#2c3a35] flex flex-col gap-1 p-3 overflow-y-auto md:hidden">
          <button
            className={cn(
              "w-full p-4 py-3.5 text-left rounded-xl font-semibold text-base",
              view === "home" ? "bg-green-soft text-green" : "hover:bg-[#f5f8f5] dark:hover:bg-[#18231f]"
            )}
            onClick={() => { setView("home"); setMobileNavOpen(false); }}
          >
            Explore
          </button>
          <button
            className={cn(
              "w-full p-4 py-3.5 text-left rounded-xl font-semibold text-base",
              view === "picks" ? "bg-green-soft text-green" : "hover:bg-[#f5f8f5] dark:hover:bg-[#18231f]"
            )}
            onClick={() => { setView("picks"); setMobileNavOpen(false); }}
          >
            Macro Picks
          </button>
          <button
            className="w-full p-4 py-3.5 text-left rounded-xl font-semibold text-base hover:bg-[#f5f8f5] dark:hover:bg-[#18231f]"
            onClick={() => setMobileNavOpen(false)}
          >
            Saved meals
          </button>
          <button
            className="w-full p-4 py-3.5 text-left rounded-xl font-semibold text-base hover:bg-[#f5f8f5] dark:hover:bg-[#18231f]"
            onClick={() => setMobileNavOpen(false)}
          >
            Favorites
          </button>
          <div className="my-2 border-t border-line dark:border-[#2c3a35]" />
          <button className="w-full h-12 border border-line dark:border-[#2c3a35] rounded-[10px] flex items-center justify-center gap-[7px] font-bold text-[13px] dark:bg-[#18231f]">
            <UserRound size={16} /> Log in
          </button>
          <button className="w-full h-12 bg-green text-white rounded-[10px] font-bold text-[13px] flex items-center justify-center">
            Get started
          </button>
        </div>
      )}

      {view === "home" ? (
        <>
          {/* Hero */}
          <section className="min-h-[552px] bg-[#f1f7ed] dark:bg-[#17271f] relative overflow-hidden">
            <div className="w-[min(1180px,calc(100%-44px))] mx-auto pt-[78px] relative z-[2]">
              <div className="w-max flex items-center gap-[6px] px-[10px] py-[6px] bg-[#e4f3e3] text-green rounded-[20px] text-[11px] font-bold tracking-[0.08em] uppercase">
                <Sparkles size={14} /> Made for eating out
              </div>
              <h1 className="mt-[17px] mb-[11px] font-display font-extrabold text-[clamp(28px,7vw,58px)] leading-[1.06] tracking-[-3.5px]">
                Track restaurant<br /><em className="not-italic text-green">macros in seconds.</em>
              </h1>
              <p className="m-0 w-[570px] max-w-full text-[17px] leading-[1.7] text-[#65736d] dark:text-[#9eada6]">
                Build meals from the places you love and instantly calculate calories, protein, carbs, and fat. No PDFs. No guesswork.
              </p>

              {/* Search Card */}
              <div className="relative w-[665px] max-w-full mt-[27px] p-2 bg-white/60 dark:bg-[#20302a]/60 border border-white/75 dark:border-[#31443b] rounded-[22px] shadow-[0_20px_40px_#5983601f] backdrop-blur-[14px]">
                <div className="w-full h-[61px] mt-0 pl-4 pr-2 flex gap-3 items-center bg-white dark:bg-[#21302a] border border-[#e0e6de] dark:border-[#2c3a35] rounded-2xl shadow-none">
                  <Search size={21} className="text-green" />
                  <input
                    value={search}
                    onChange={event => setSearch(event.target.value)}
                    onKeyDown={event => { if (event.key === "Enter") openFirstSearchResult(); }}
                    placeholder="Search restaurants or foods"
                    className="border-0 outline-none flex-1 text-[15px] bg-transparent dark:text-white"
                  />
                  <span className="text-[11px] text-[#a4ada7] px-[6px] py-[3px] border border-[#edf0ed] rounded-[5px]">Enter</span>
                  <button onClick={openFirstSearchResult} className="h-[45px] px-5 rounded-[11px] bg-green text-white font-bold text-sm">
                    Search
                  </button>
                </div>

                {search && (
                  <div className="absolute left-0 right-0 top-[78px] w-auto bg-white dark:bg-[#21302a] border border-line dark:border-[#2c3a35] rounded-2xl p-[9px] shadow-card z-[4]">
                    {shownRestaurants.length > 0 && (
                      <p className="mx-2 mt-[7px] mb-[5px] text-green text-[10px] font-extrabold tracking-[0.12em] uppercase">Restaurants</p>
                    )}
                    {shownRestaurants.map(r => (
                      <button
                        key={r.id}
                        onClick={() => openRestaurant(r.id)}
                        className="w-full flex items-center gap-[10px] p-2 rounded-[10px] text-left hover:bg-[#f5f8f5] dark:hover:bg-[#2a3830]"
                      >
                        <Logo id={r.id} small />
                        <span className="flex-1"><b>{r.name}</b><small className="text-muted block">{r.description}</small></span>
                        <ArrowRight size={16} />
                      </button>
                    ))}
                    {shownItems.length > 0 && (
                      <p className="mx-2 mt-[7px] mb-[5px] text-green text-[10px] font-extrabold tracking-[0.12em] uppercase">Menu matches</p>
                    )}
                    {shownItems.map(item => {
                      const itemRestaurant = restaurants.find(r => r.id === item.restaurantId)!;
                      return (
                        <button
                          key={item.id}
                          onClick={() => openRestaurant(item.restaurantId)}
                          className="w-full flex items-center gap-[10px] p-2 rounded-[10px] text-left hover:bg-[#f5f8f5] dark:hover:bg-[#2a3830]"
                        >
                          <Logo id={item.restaurantId} small />
                          <span className="flex-1"><b>{item.name}</b><small className="text-muted block">{itemRestaurant.name} · {item.calories} cal · {item.protein}g protein</small></span>
                          <ArrowRight size={16} />
                        </button>
                      );
                    })}
                    {shownRestaurants.length === 0 && shownItems.length === 0 && (
                      <div className="flex flex-col gap-[3px] p-[15px] text-muted text-xs">
                        <b className="text-ink">No exact match yet</b>
                        <small>Try a restaurant, food, or category like &ldquo;coffee&rdquo;, &ldquo;beef&rdquo;, or &ldquo;Blizzard&rdquo;.</small>
                      </div>
                    )}
                  </div>
                )}

                <div className="flex flex-wrap gap-2 items-center mt-[9px] px-[3px] pb-[2px] text-xs">
                  <span className="text-[#849087]">Try:</span>
                  {featuredSearches.map(item => (
                    <button
                      key={item}
                      onClick={() => setSearch(item)}
                      className="px-2 py-[5px] text-[#617168] bg-white dark:bg-[#21302a] border border-[#e5e9e3] dark:border-[#2c3a35] rounded-[7px]"
                    >
                      {item}
                    </button>
                  ))}
                </div>
              </div>

              {/* Hero Proof */}
              <div className="flex gap-[34px] mt-[38px]">
                <div className="flex flex-col border-r border-[#d7dfd3] pr-[34px]">
                  <span className="font-display font-extrabold text-[20px] text-green">{menuItems.length}+</span>
                  <small className="mt-[3px] text-[11px] text-[#7b8a82] uppercase tracking-[0.08em]">tracked rows</small>
                </div>
                <div className="flex flex-col border-r border-[#d7dfd3] pr-[34px]">
                  <span className="font-display font-extrabold text-[20px] text-green">{restaurants.length}</span>
                  <small className="mt-[3px] text-[11px] text-[#7b8a82] uppercase tracking-[0.08em]">restaurants</small>
                </div>
                <div className="flex flex-col">
                  <span className="font-display font-extrabold text-[20px] text-green">&lt; 10s</span>
                  <small className="mt-[3px] text-[11px] text-[#7b8a82] uppercase tracking-[0.08em]">to build a meal</small>
                </div>
              </div>
            </div>
            <div className="absolute rounded-full blur-[1px] opacity-[0.65] w-[470px] h-[470px] -right-[60px] -top-[80px] bg-[#d6ead2]" />
            <div className="absolute rounded-full blur-[1px] opacity-[0.65] w-[260px] h-[260px] right-[250px] -bottom-[150px] bg-[#e5f2d7]" />
          </section>

          {/* Popular Restaurants */}
          <section className="w-[min(1180px,calc(100%-44px))] mx-auto py-16 md:py-[75px]">
            <div className="flex items-end justify-between">
              <div>
                <p className="m-0 text-green font-bold text-[11px] tracking-[0.14em]">EXPLORE</p>
                <h2 className="mt-[6px] mb-[5px] font-display font-extrabold text-[clamp(24px,4vw,32px)] tracking-[-1.5px]">Popular restaurants</h2>
                <span className="text-muted text-[15px]">Start building a meal from a fan favorite.</span>
              </div>
              <button className="flex items-center gap-2 text-green text-[13px] font-bold">View all <ArrowRight size={16} /></button>
            </div>

            {/* Collections */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 mt-6">
              {homeCollections.map(collection => (
                <div
                  key={collection.label}
                  className="p-[15px] bg-gradient-to-br from-white to-[#f5faf4] dark:bg-card border border-line dark:border-[#2c3a35] rounded-[15px]"
                >
                  <b className="block font-display font-extrabold text-sm">{collection.label}</b>
                  <small className="block mt-[3px] text-muted text-[11px]">{collection.description}</small>
                  <div className="flex gap-[6px] mt-3">
                    {collection.ids.map(id => (
                      <button
                        key={id}
                        onClick={() => openRestaurant(id)}
                        aria-label={`Open ${restaurants.find(r => r.id === id)?.name ?? id}`}
                        className="transition-all duration-200 hover:-translate-y-[2px]"
                      >
                        <Logo id={id} small />
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* Restaurant Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 mt-7">
              {restaurants.map(r => (
                <button
                  key={r.id}
                  onClick={() => openRestaurant(r.id)}
                  className="text-left p-[17px] bg-card dark:bg-[#18231f] border border-line dark:border-[#2c3a35] rounded-[14px] transition-all duration-200 hover:-translate-y-1 hover:shadow-card hover:border-[#d3e0d5]"
                >
                  <div className="flex justify-between items-center">
                    <Logo id={r.id} />
                    <Heart size={17} className="text-[#a8b1ac]" />
                  </div>
                  <h3 className="font-display font-bold text-[15px] mt-[17px] mb-1">{r.name}</h3>
                  <p className="m-0 mb-4 text-muted text-xs">{r.description}</p>
                  <div className="flex items-center justify-between">
                    <span className="px-2 py-1 text-[#74827b] bg-[#f5f7f4] dark:bg-[#25332e] rounded-xl text-[10px]">{r.category}</span>
                    <ArrowRight size={17} className="text-green" />
                  </div>
                </button>
              ))}
            </div>
          </section>

          {/* Feature Banner */}
          <section className="w-[min(1180px,calc(100%-44px))] mx-auto mt-3 mb-20 px-[54px] py-[46px] flex flex-col md:flex-row justify-between items-center bg-[#153f30] dark:bg-[#1d4a39] text-white rounded-[20px] overflow-hidden gap-8">
            <div>
              <div className="w-max flex items-center gap-[6px] px-[10px] py-[6px] bg-[#e4f3e3] text-green rounded-[20px] text-[11px] font-bold tracking-[0.08em] uppercase">
                <Zap size={14} /> Fast and flexible
              </div>
              <h2 className="mt-[14px] mb-[9px] font-display font-extrabold text-[34px] leading-[1.2] tracking-[-1.6px]">
                Your macros. Your order.<br /><em className="not-italic text-green">Your goals.</em>
              </h2>
              <p className="max-w-[450px] text-[#c1d4cc] text-sm leading-[1.6]">
                Adjust serving sizes, account for heavy scoops, and save your go-to meals for next time.
              </p>
              <button
                onClick={() => openRestaurant("panda")}
                className="flex items-center gap-2 mt-[21px] px-4 py-3 rounded-[9px] bg-[#f1b650] text-[13px] font-bold text-[#223329]"
              >
                Build your first meal <ArrowRight size={17} />
              </button>
            </div>

            {/* Mini Meal Card */}
            <div className="w-[400px] bg-white dark:bg-[#f9fbfa] text-ink rounded-[14px] p-[15px] shadow-[0_20px_45px_#06251e55] flex-shrink-0">
              <p className="flex justify-between mb-2 text-[10px] font-bold tracking-[0.12em] text-[#7b8982]">
                YOUR MEAL
                <span className="flex gap-1 items-center text-green"><Check size={13} /> Live totals</span>
              </p>
              {[["Grilled Teriyaki Chicken", "275 cal", "33g protein"], ["Super Greens", "130 cal", "9g protein"], ["White Steamed Rice", "520 cal", "10g protein"]].map(item => (
                <div key={item[0]} className="grid grid-cols-[25px_1fr] gap-px py-[10px] border-t border-line text-xs">
                  <span className="row-span-2 grid place-items-center w-[19px] h-[19px] mt-[5px] text-white bg-green rounded-full"><Check size={14} /></span>
                  <b>{item[0]}</b>
                  <small className="text-[#89948f]">{item[1]} · {item[2]}</small>
                </div>
              ))}
              <footer className="flex justify-between px-[9px] py-3 bg-[#f4f8f4] rounded-lg">
                <span className="flex flex-col gap-[3px]"><b className="text-green text-[17px]">925</b><small className="text-[8px] text-[#849088] tracking-[0.08em]">CALORIES</small></span>
                <span className="flex flex-col gap-[3px]"><b className="text-green text-[17px]">52g</b><small className="text-[8px] text-[#849088] tracking-[0.08em]">PROTEIN</small></span>
                <span className="flex flex-col gap-[3px]"><b className="text-green text-[17px]">146g</b><small className="text-[8px] text-[#849088] tracking-[0.08em]">CARBS</small></span>
                <span className="flex flex-col gap-[3px]"><b className="text-green text-[17px]">14g</b><small className="text-[8px] text-[#849088] tracking-[0.08em]">FAT</small></span>
              </footer>
            </div>
          </section>
        </>
      ) : view === "picks" ? (
        <MacroPicks loadMacroPick={loadMacroPick} openRestaurant={openRestaurant} />
      ) : (
        <>
          {/* Restaurant Hero */}
          <section className="pt-[22px] pb-[29px] bg-[#f0f6ed] dark:bg-[#17271f] border-b border-[#e2e9de] dark:border-[#2c3a35]">
            <div className="w-[min(1180px,calc(100%-44px))] mx-auto">
              <button
                className="flex gap-[5px] items-center text-green text-xs font-bold"
                onClick={() => setView("home")}
              >
                <ChevronLeft size={16} /> All restaurants
              </button>
              <div className="flex items-center gap-4 mt-[19px]">
                <Logo id={restaurant.id} />
                <div>
                  <div className="flex gap-[7px]">
                    <span className="flex items-center gap-1 px-[7px] py-[3px] rounded-[10px] bg-white dark:bg-[#21302a] text-[#738078] text-[9px] font-bold uppercase tracking-[0.06em]">{restaurant.category}</span>
                    <span className="flex items-center gap-1 px-[7px] py-[3px] rounded-[10px] bg-white dark:bg-[#21302a] text-[#738078] text-[9px] font-bold uppercase tracking-[0.06em]"><Sparkles size={12} /> {officialBaselineRestaurants.has(restaurant.id) ? "Official baseline" : "Nutrition preview"}</span>
                  </div>
                  <h1 className="mt-[7px] mb-[3px] font-display font-extrabold text-[33px] tracking-[-1.8px]">{restaurant.name}</h1>
                  <p className="m-0 text-muted text-[13px]">{restaurant.description} · Updated nutrition data</p>
                </div>
                <button className="flex items-center gap-[7px] ml-auto px-3 py-[10px] border border-[#dce5dc] dark:border-[#2c3a35] rounded-[9px] bg-white dark:bg-[#18231f] text-[#64726c] text-xs font-bold">
                  <Heart size={18} /> Favorite
                </button>
              </div>
            </div>
          </section>

          {/* Builder Layout */}
          <section className="w-[min(1180px,calc(100%-44px))] mx-auto grid grid-cols-1 lg:grid-cols-[1fr_330px] gap-7 py-7 pb-24">
            <div className="catalog">
              <RestaurantBuilder
                restaurantId={restaurantId}
                meal={orderType}
                setMeal={setOrderType}
                selected={selected}
                addItem={addItem}
                removeItem={removeItem}
                updateQuantity={updateQuantity}
                jerseySize={jerseySize}
                setJerseySize={setJerseySize}
                subwaySize={subwaySize}
                setSubwaySize={setSubwaySize}
                starbucksSize={starbucksSize}
                setStarbucksSize={setStarbucksSize}
              />
            </div>
            <MealPanel
              selected={selected}
              totals={totals}
              portion={portion}
              setPortion={setPortion}
              removeItem={removeItem}
              updateQuantity={updateQuantity}
              saved={saved}
              setSaved={setSaved}
              officialBaseline={officialBaselineRestaurants.has(restaurantId)}
            />
          </section>

          {/* Mobile Meal Button */}
          <button
            className="lg:hidden fixed z-[12] bottom-[14px] left-[14px] right-[14px] h-[55px] flex items-center gap-[10px] px-[17px] rounded-xl bg-green text-white shadow-[0_8px_22px_#133b2c44]"
            onClick={() => setDrawer(true)}
          >
            <span className="flex gap-[7px] items-center text-xs"><ShoppingBag size={18} />{selected.length} items</span>
            <b className="ml-auto text-[13px]">{round(totals.calories)} cal</b>
            <ChevronRight size={17} />
          </button>

          {/* Drawer */}
          {drawer && (
            <div
              className="flex fixed inset-0 z-[30] items-end bg-[#00140d]/[0.53]"
              onClick={() => setDrawer(false)}
            >
              <div
                className="w-full max-h-[88vh] overflow-auto p-[15px] bg-bg dark:bg-[#111a17] rounded-t-[18px]"
                onClick={e => e.stopPropagation()}
              >
                <button aria-label="Close" className="block mb-[5px] ml-auto text-muted" onClick={() => setDrawer(false)}><X /></button>
                <MealPanel
                  selected={selected}
                  totals={totals}
                  portion={portion}
                  setPortion={setPortion}
                  removeItem={removeItem}
                  updateQuantity={updateQuantity}
                  saved={saved}
                  setSaved={setSaved}
                  officialBaseline={officialBaselineRestaurants.has(restaurantId)}
                  isDrawer
                />
              </div>
            </div>
          )}
        </>
      )}
    </main>
  );
}

function MacroPicks({ loadMacroPick, openRestaurant }: { loadMacroPick: (pick: MacroPick) => void; openRestaurant: (id: string) => void }) {
  const [goal, setGoal] = useState<MacroPickGoal | "All">("All");
  const [restaurantFilter, setRestaurantFilter] = useState("All");
  const filteredPicks = macroPicks.filter(pick => (goal === "All" || pick.goal === goal) && (restaurantFilter === "All" || pick.restaurantId === restaurantFilter));
  const pickRestaurants = Array.from(new Set(macroPicks.map(pick => pick.restaurantId)));
  const pickTotals = (pick: MacroPick) => macroTotal(pick.items.map(row => ({
    item: menuItems.find(item => item.id === row.id)!,
    quantity: row.quantity ?? 1,
  })));

  return (
    <>
      {/* Picks Hero */}
      <section className="py-[54px] bg-[radial-gradient(circle_at_78%_20%,#d7ecd4_0%,#eef7ea_30%,#f5faf2_72%)] dark:bg-[#17271f] border-b border-line dark:border-[#2c3a35]">
        <div className="w-[min(1180px,calc(100%-44px))] mx-auto grid grid-cols-1 md:grid-cols-[1fr_310px] gap-[30px] items-center">
          <div>
            <div className="w-max flex items-center gap-[6px] px-[10px] py-[6px] bg-[#e4f3e3] text-green rounded-[20px] text-[11px] font-bold tracking-[0.08em] uppercase">
              <Sparkles size={14} /> Macro Picks
            </div>
            <h1 className="mt-[14px] mb-2 font-display font-extrabold text-[48px] leading-[1.05] tracking-[-2.8px]">
              Good orders, already built.
            </h1>
            <p className="max-w-[680px] m-0 text-muted text-base leading-[1.7]">
              Browse restaurant meals for high protein, cutting, low carb, bulking, or the best protein per calorie. Each card uses the same menu database as the builder.
            </p>
          </div>
          <div className="p-[22px] bg-white dark:bg-[#18231f] border border-line dark:border-[#2c3a35] rounded-[18px] shadow-card">
            <span className="text-green text-[10px] font-extrabold tracking-[0.12em] uppercase">Featured metric</span>
            <b className="block mt-2 font-display font-extrabold text-[25px] tracking-[-1px]">Protein per calorie</b>
            <small className="block mt-2 text-muted text-xs leading-[1.5]">Great for finding meals that are filling without blowing up calories.</small>
          </div>
        </div>
      </section>

      {/* Picks Section */}
      <section className="w-[min(1180px,calc(100%-44px))] mx-auto pt-[38px] pb-[80px]">
        <div className="flex items-end justify-between gap-[18px]">
          <div>
            <span className="block mb-[7px] text-green text-[10px] font-bold tracking-[0.14em]">SMART FILTERS</span>
            <h2 className="mt-[5px] mb-0 font-display font-extrabold text-[30px] tracking-[-1.3px]">Choose your goal</h2>
          </div>
          <select
            aria-label="Filter by restaurant"
            value={restaurantFilter}
            onChange={event => setRestaurantFilter(event.target.value)}
            className="h-[42px] min-w-[210px] px-[13px] bg-white dark:bg-[#18231f] border border-line dark:border-[#2c3a35] rounded-[10px] text-ink dark:text-[#f3f7f5] outline-none"
          >
            <option value="All">All restaurants</option>
            {pickRestaurants.map(id => (
              <option key={id} value={id}>{restaurants.find(item => item.id === id)!.name}</option>
            ))}
          </select>
        </div>

        {/* Goal Tabs */}
        <div className="flex gap-2 my-[22px] overflow-auto scrollbar-hide">
          {(["All", ...macroPickGoals] as const).map(item => (
            <button
              key={item}
              onClick={() => setGoal(item)}
              className={cn(
                "whitespace-nowrap px-[13px] py-[9px] border rounded-full text-xs font-bold",
                goal === item
                  ? "bg-green border-green text-white"
                  : "bg-white dark:bg-[#18231f] border-line dark:border-[#2c3a35] text-[#6f7d76] dark:text-[#9eada6]"
              )}
            >
              {item}
            </button>
          ))}
        </div>

        {/* Picks Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {filteredPicks.map(pick => {
            const restaurant = restaurants.find(item => item.id === pick.restaurantId)!;
            const totals = pickTotals(pick);
            const ratio = totals.calories ? (totals.protein / totals.calories * 100).toFixed(1) : "0.0";
            return (
              <article
                key={pick.title}
                className="flex flex-col gap-[13px] p-4 bg-card dark:bg-[#18231f] border border-line dark:border-[#2c3a35] rounded-2xl shadow-[0_9px_24px_#3d5e4e0b]"
              >
                <header className="flex gap-[10px] items-center">
                  <Logo id={pick.restaurantId} small />
                  <div>
                    <span className="text-green text-[9px] font-extrabold tracking-[0.12em] uppercase">{pick.goal}</span>
                    <h3 className="mt-[3px] mb-[1px] font-display font-extrabold text-[17px] tracking-[-0.5px]">{pick.title}</h3>
                    <small className="text-muted text-[11px]">{restaurant.name}</small>
                  </div>
                </header>
                <p className="min-h-[48px] m-0 text-muted text-xs leading-[1.45]">{pick.description}</p>
                <MacroStats macro={totals} />
                <div className="flex items-end gap-[7px] px-3 py-[10px] bg-[#f1f8f1] dark:bg-[#22332b] rounded-[10px]">
                  <b className="font-display font-extrabold text-[22px] text-green">{ratio}g</b>
                  <small className="mb-[3px] text-[#7d8a83] text-[10px] uppercase tracking-[0.08em]">protein per 100 cal</small>
                </div>
                <div className="flex flex-wrap gap-[6px]">
                  {pick.items.map(row => {
                    const item = menuItems.find(menuItem => menuItem.id === row.id)!;
                    return (
                      <span
                        key={row.id}
                        className="px-[7px] py-[5px] bg-[#f7f9f6] dark:bg-[#22302b] border border-line dark:border-[#2c3a35] rounded-full text-[#68766f] text-[10px]"
                      >
                        {row.quantity && row.quantity > 1 ? `${row.quantity}x ` : ""}{item.name}
                      </span>
                    );
                  })}
                </div>
                <footer className="grid grid-cols-2 gap-2 mt-auto">
                  <button
                    onClick={() => loadMacroPick(pick)}
                    className="h-[38px] flex items-center justify-center gap-[5px] rounded-[9px] text-xs font-extrabold bg-green text-white"
                  >
                    <Check size={15} /> Use this pick
                  </button>
                  <button
                    onClick={() => openRestaurant(pick.restaurantId)}
                    className="h-[38px] flex items-center justify-center gap-[5px] rounded-[9px] text-xs font-extrabold border border-line dark:border-[#2c3a35] text-green bg-white dark:bg-[#18231f]"
                  >
                    Customize <ArrowRight size={15} />
                  </button>
                </footer>
                <small className="flex items-start gap-[5px] text-[#8b9691] text-[10px] leading-[1.4]">
                  <Sparkles size={12} className="flex-none text-green" /> {pick.why}
                </small>
              </article>
            );
          })}
        </div>
      </section>
    </>
  );
}

const builderConfigs: Record<string, BuilderConfig> = {
  panda: { meals: [{ name: "Bowl", description: "1 side + 1 entree" }, { name: "Plate", description: "1 side + 2 entrees" }, { name: "Bigger Plate", description: "1 side + 3 entrees" }, { name: "A la Carte", description: "Build your own combo" }], groups: [{ label: "Choose your entrees", help: "Mix favorites or make an entree double", categories: ["Entrees"] }, { label: "Choose your sides", help: "Pick rice, noodles, greens, or go half and half", categories: ["Sides"] }, { label: "Extras", help: "Add appetizers, drinks, and something sweet", categories: ["Appetizers", "Drinks", "Desserts"] }], tip: "Use Light, Regular, or Double for every scoop, including half rice and half greens." },
  chipotle: { meals: [{ name: "Bowl", description: "The classic build" }, { name: "Burrito", description: "Includes flour tortilla", baseIds: ["chip-tortilla"] }, { name: "Salad", description: "Fresh greens base" }, { name: "Tacos", description: "Includes 3 crispy shells", baseIds: ["chip-taco-shells"] }, { name: "Kid's Meal", description: "Quesadilla or build-your-own" }], groups: [{ label: "Choose your protein", help: "Pick one, mix two, or go double, including limited-time proteins", categories: ["Protein"], showWhen: ["Bowl", "Burrito", "Salad", "Tacos"] }, { label: "Rice", help: "Make it light, regular, or double", categories: ["Rice"], showWhen: ["Bowl", "Burrito", "Salad", "Tacos"] }, { label: "Beans", help: "Add one or both", categories: ["Beans"], showWhen: ["Bowl", "Burrito", "Salad", "Tacos"] }, { label: "Toppings", help: "Finish it exactly how you order it", categories: ["Toppings"], showWhen: ["Bowl", "Burrito", "Salad", "Tacos"] }, { label: "Sides and extras", help: "Add protein cups, chips, or a tortilla on the side", categories: ["Protein Cups", "Sides"], variant: "extras", showWhen: ["Bowl", "Burrito", "Salad", "Tacos"] }, { label: "Kids base", help: "Choose the kid-size taco tortillas, crispy shells, or quesadilla tortilla", categories: ["Kids Base"], variant: "kids", showWhen: ["Kid's Meal"] }, { label: "Kids protein", help: "Kid-sized 2 oz meat or sofritas portions", categories: ["Kids Proteins"], variant: "kids", showWhen: ["Kid's Meal"] }, { label: "Kids rice and beans", help: "Kid-sized rice and bean portions", categories: ["Kids Rice & Beans"], variant: "kids", showWhen: ["Kid's Meal"] }, { label: "Kids toppings", help: "Kid-sized toppings like cheese, salsa, sour cream, guac, and lettuce", categories: ["Kids Toppings"], variant: "kids", showWhen: ["Kid's Meal"] }, { label: "Kids fruit, chips, and drinks", help: "Add the kid side and drink options", categories: ["Kids Fruit & Drinks", "Kids Drinks"], variant: "kids", showWhen: ["Kid's Meal"] }], tip: "Choose double steak, honey chicken, extra rice, protein cups, chips, tortillas, kids meals, and every topping individually." },
  chickfila: { meals: [{ name: "Entree", description: "Sandwich, nuggets, or grilled protein" }, { name: "Combo", description: "Entree + side + drink" }, { name: "Sides & Treats", description: "Build a snack or lighter meal" }], groups: [{ label: "Choose your entree", help: "Add one or combine items", categories: ["Entrees"] }, { label: "Choose your sides", help: "Fries, fruit, or both", categories: ["Sides"] }, { label: "Sauces", help: "Track every dipping sauce packet", categories: ["Sauces"] }, { label: "Drinks", help: "Finish your combo", categories: ["Drinks"] }], tip: "Sauces count too. Add each packet and adjust the quantity if you use more than one." },
  potbelly: { meals: [{ name: "Build your own sandwich", description: "Bread, meat, cheese, toppings" }, { name: "Toasty favorite", description: "Start with a known sandwich" }, { name: "Pick-your-pair", description: "Sandwich + side" }], groups: [{ label: "Choose your bread", help: "Start with the bread style you actually ordered", categories: ["Bread"] }, { label: "Choose meats", help: "Add turkey, ham, roast beef, or double portions", categories: ["Meats"] }, { label: "Choose cheese", help: "Add or skip cheese", categories: ["Cheese"] }, { label: "Spreads and toppings", help: "Mayo, mustard, avocado, peppers, lettuce, tomato", categories: ["Spreads", "Toppings"] }, { label: "Customize it", help: "Remove default ingredients or add extras", categories: ["Remove Ingredients", "Add Extras"] }, { label: "Premade favorites and sides", help: "Optional shortcuts or add-ons", categories: ["Sandwiches", "Sides"] }], tip: "Potbelly is shown as preview data until its current official component feed is imported; the flow is ready for bread, meats, cheese, spreads, toppings, and removals." },
  jimmyjohns: { meals: [{ name: "Build your own sandwich", description: "Bread, meats, cheese, freebies" }, { name: "Original 8-inch", description: "Classic French bread order" }, { name: "Unwich", description: "Lettuce-wrapped low-carb order" }], groups: [{ label: "Choose your bread", help: "French, sliced wheat, or Unwich lettuce wrap", categories: ["Bread"] }, { label: "Choose meats", help: "Regular, light, or double meat portions", categories: ["Meats"] }, { label: "Choose cheese", help: "Add provolone or skip it", categories: ["Cheese"] }, { label: "Spreads", help: "Mayo, oil and vinegar, and other add-ons", categories: ["Spreads"] }, { label: "Toppings", help: "Freebies like peppers, tomato, and lettuce", categories: ["Toppings"] }, { label: "Customize it", help: "Remove default ingredients or add extras", categories: ["Remove Ingredients", "Add Extras"] }, { label: "Premade favorites", help: "Optional shortcuts if you know the sandwich name", categories: ["Sandwiches"] }], tip: "Jimmy John's component macros use its official add-on guide for 8-inch French, Unwich, sliced wheat, wraps, and customizations." },
  jerseymikes: { meals: [{ name: "Build your own sub", description: "Bread, meats, cheese, Mike's Way" }, { name: "Regular sub", description: "Classic regular-size sub" }, { name: "Sub in a Tub", description: "No-bread bowl order" }], groups: [{ label: "Choose your bread", help: "White, wheat, rosemary parmesan, or no-bread Sub in a Tub", categories: ["Bread"] }, { label: "Choose meats", help: "Add fresh-sliced meats, bacon, and double portions", categories: ["Meats"] }, { label: "Choose cheese", help: "Add provolone or skip it", categories: ["Cheese"] }, { label: "Spreads and Mike's Way", help: "Add mayo, oil, vinegar, lettuce, tomato, onion, or skip anything by not selecting it", categories: ["Spreads", "Toppings"] }, { label: "Premade favorites", help: "Optional shortcuts while the official import is pending", categories: ["Sandwiches"] }], tip: "Jersey Mike's is a true build-your-own flow: nothing is assumed, so users add bread, meat, cheese, spreads, and toppings only when they want them." },
  mcdonalds: { meals: [{ name: "Combo meal", description: "Entree + fries + drink" }, { name: "Burgers", description: "Big Mac, Quarter Pounder, cheeseburgers" }, { name: "Chicken and nuggets", description: "McChicken, McCrispy, McNuggets, fish" }, { name: "Breakfast", description: "Morning sandwiches and sides" }, { name: "Drinks and sweets", description: "Fountain drinks, McCafe, desserts" }], groups: [{ label: "Burgers", help: "Start with the burger or sandwich you actually ordered", categories: ["Burgers"] }, { label: "Chicken, fish, and nuggets", help: "McChicken, McCrispy, Filet-O-Fish, McNuggets, and other proteins", categories: ["Chicken & Fish"] }, { label: "Customize it", help: "Use removals like no mayo or no cheese, then add extras like bacon or extra cheese", categories: ["Remove Ingredients", "Add Extras"] }, { label: "Breakfast", help: "Morning sandwiches, hash browns, and hotcakes", categories: ["Breakfast"] }, { label: "Sides", help: "Fries use size buttons; other sides track by item", categories: ["Sides"] }, { label: "Drinks", help: "Fountain drinks use size buttons where available", categories: ["Drinks"] }, { label: "McCafe", help: "Coffee drinks and shakes", categories: ["McCafe"] }, { label: "Sauces and desserts", help: "Track every sauce packet, cone, or pie", categories: ["Sauces", "Desserts"] }], tip: "McDonald's now supports customization rows too. Add the entree, then subtract removals like no mayo or no cheese, or add extras like bacon, cheese, and sauce." },
  culvers: { meals: [{ name: "Value basket", description: "Entree + side + drink" }, { name: "ButterBurger", description: "Single, double, deluxe, mushroom swiss" }, { name: "Chicken and seafood", description: "Sandwiches, tenders, fish, shrimp" }, { name: "Sides and salads", description: "Curds, fries, broccoli, soup, salads" }, { name: "Custard run", description: "Scoops, mixers, shakes, sundaes" }], groups: [{ label: "ButterBurgers", help: "Choose the burger base first, then add sides and drinks", categories: ["Burgers"] }, { label: "Chicken, fish, and baskets", help: "Track chicken sandwiches, tenders, cod, shrimp, and pot roast", categories: ["Chicken & Fish"] }, { label: "Customize it", help: "Remove mayo, cheese, bun, or add bacon and extra patties", categories: ["Remove Ingredients", "Add Extras"] }, { label: "Sides", help: "Fries, curds, onion rings, broccoli, chili, and more", categories: ["Sides"] }, { label: "Salads and soup", help: "Lighter meals and add-ons", categories: ["Salads & Soup"] }, { label: "Frozen custard", help: "Scoops, mixers, sundaes, and shakes", categories: ["Frozen Custard"] }, { label: "Drinks and sauces", help: "Finish the value basket", categories: ["Drinks", "Sauces"] }], tip: "Culver's now follows the value-basket flow with entree, customization, side, drink, sauces, and custard." },
  starbucks: { meals: [{ name: "Coffee", description: "Brewed, iced coffee, cold brew" }, { name: "Espresso drink", description: "Latte, americano, mocha, macchiato" }, { name: "Refresher", description: "Fruit refreshers and coconutmilk drinks" }, { name: "Tea and matcha", description: "Tea lattes, chai, matcha, iced teas" }, { name: "Frappuccino", description: "Blended coffee and creme drinks" }, { name: "Food", description: "Breakfast and snacks" }], groups: [{ label: "Coffee", help: "Brewed coffee, iced coffee, cold brew, and sweet cream cold brew", categories: ["Coffee"] }, { label: "Espresso", help: "Lattes, americanos, mochas, macchiatos, and flat whites", categories: ["Espresso"] }, { label: "Refreshers", help: "Strawberry Acai, Mango Dragonfruit, Pink Drink, and lemonade refreshers", categories: ["Refreshers"] }, { label: "Tea and matcha", help: "Chai, matcha, iced tea, and tea lemonades", categories: ["Tea & Matcha"] }, { label: "Frappuccino", help: "Coffee and creme blended beverages", categories: ["Frappuccino"] }, { label: "Customize it", help: "Track milk, syrup pumps, foam, shots, and removals like no whip", categories: ["Customizations", "Remove Ingredients", "Add Extras"] }, { label: "Food", help: "Breakfast sandwiches, egg bites, bakery, and protein boxes", categories: ["Food"] }], tip: "Choose a drink size first, then pick from the Starbucks menu sections. Drink customizations, removals, and add-ons update totals." },
  tacobell: { meals: [{ name: "Taco", description: "Shell + protein + toppings" }, { name: "Burrito", description: "Tortilla + fillings + sauces" }, { name: "Bowl or power menu", description: "Rice, beans, protein, toppings" }, { name: "Crunchwrap or quesadilla", description: "Start with a folded favorite" }, { name: "Combo", description: "Entrees + side + drink" }], groups: [{ label: "Start with a base", help: "Choose the shell, tortilla, bowl, or known entree shortcut", categories: ["Taco Bell Bases", "Entrees"] }, { label: "Protein and beans", help: "Add beef, chicken, steak, black beans, or refried beans", categories: ["Proteins", "Beans & Rice"] }, { label: "Rice, potatoes, and cheese", help: "Build the filling the way you actually ordered it", categories: ["Starches", "Cheese"] }, { label: "Toppings", help: "Lettuce, tomatoes, onions, guac, sour cream, and more", categories: ["Toppings"] }, { label: "Customize it", help: "Remove default sauces or add extras", categories: ["Remove Ingredients", "Add Extras"] }, { label: "Sauces", help: "Creamy sauces, red sauce, nacho cheese, and sauce packets", categories: ["Sauces"] }, { label: "Sides, sweets, and drinks", help: "Add Nacho Fries, chips, twists, Cinnabon, and drinks", categories: ["Sides", "Desserts", "Drinks"] }], tip: "Taco Bell now works like a custom builder: pick the shell or entree, add fillings, remove defaults, and add extras individually." },
  subway: { meals: [{ name: "Build your own sub", description: "Size, bread, protein, toppings" }, { name: "Protein bowl or salad", description: "Protein, cheese, veggies, sauce" }, { name: "Named sandwiches", description: "Official 6-inch baselines" }, { name: "Sides and sweets", description: "Cookies, brownies, chips" }], groups: [{ label: "Choose bread", help: "Pick the 6-inch bread or flatbread first, then choose 6-inch or Footlong above", categories: ["Bread"] }, { label: "Choose protein", help: "Add turkey, ham, chicken, steak, tuna, meatballs, bacon, or double portions", categories: ["Meats"] }, { label: "Cheese", help: "Add cheese if your order includes it", categories: ["Cheese"] }, { label: "Veggies and toppings", help: "Veggies, avocado, olives, pickles, jalapenos, and more", categories: ["Toppings"] }, { label: "Sauces", help: "Track sauce portions separately", categories: ["Sauces"] }, { label: "Sandwich baselines", help: "Use these when you know the named Subway sandwich", categories: ["Sandwiches"] }, { label: "Desserts and sides", help: "Add cookies, brownies, chips, or sides", categories: ["Desserts", "Sides"] }], tip: "Subway now follows the Jersey Mike's style: pick size, bread, protein, cheese, veggies, and sauces. Named sandwiches are optional shortcuts." },
  fiveguys: { meals: [{ name: "Build your own burger", description: "Bun, patties, cheese, toppings" }, { name: "Fries", description: "Five Guys or Cajun style" }, { name: "Shake", description: "Base plus mix-ins" }, { name: "Hot dog or extras", description: "A la carte components" }], groups: [{ label: "Start with bread", help: "Add the bun if your burger has one", categories: ["Bread"] }, { label: "Patties", help: "Add one or two hamburger patties", categories: ["Patties"] }, { label: "Cheese and bacon", help: "Add cheese slices or bacon", categories: ["Cheese", "Meats"] }, { label: "Toppings", help: "Five Guys toppings are logged only when selected", categories: ["Toppings"] }, { label: "Sauces", help: "Mayo, BBQ, hot sauce, mustard, and more", categories: ["Sauces"] }, { label: "Fries", help: "Use exact Little, Regular, and Large fry macros", categories: ["Sides"] }, { label: "Shakes", help: "Start with a shake base, then add mix-ins", categories: ["Shakes", "Shake Mix-ins"] }], tip: "Five Guys is a perfect build-your-own restaurant: bun, patties, cheese, bacon, toppings, sauces, fries, and shake mix-ins are separate." },
  shakeshack: { meals: [{ name: "Burgers", description: "Shack burgers and build components" }, { name: "Chicken", description: "Chicken Shack or bites" }, { name: "Fries", description: "Regular or cheese fries" }, { name: "Shakes and drinks", description: "Shakes, lemonade, soda" }], groups: [{ label: "Burgers", help: "Choose a Shack burger or build with components", categories: ["Burgers"] }, { label: "Burger components", help: "Roll, patty, cheese, bacon, and ShackSauce", categories: ["Bread", "Patties", "Cheese", "Meats", "Sauces"] }, { label: "Chicken", help: "Chicken sandwiches, bites, and sauces", categories: ["Chicken"] }, { label: "Sides", help: "Fries and cheese fries", categories: ["Sides"] }, { label: "Shakes", help: "Hand-spun shakes", categories: ["Shakes"] }, { label: "Drinks", help: "Soda and lemonade", categories: ["Drinks"] }], tip: "Shake Shack has a clean nutrition PDF, so starter items include burgers, components, chicken, fries, shakes, and drinks." },
  dairyqueen: { meals: [{ name: "Burgers and chicken", description: "Stackburgers, chicken, fish, hot dogs" }, { name: "Sides", description: "Fries, curds, sauces" }, { name: "Blizzards", description: "Treat size picker" }, { name: "Shakes and drinks", description: "Shakes, smoothies, Julius" }, { name: "Sundaes and desserts", description: "Cones, sundaes, cakes, drinks" }], groups: [{ label: "Burgers", help: "Stackburger rows use official listed item macros", categories: ["Burgers"] }, { label: "Hot dogs", help: "Classic DQ hot dogs and chili cheese dogs", categories: ["Hot Dogs"] }, { label: "Chicken and fish", help: "Chicken strips, sandwiches, fish, and salads", categories: ["Chicken", "Salads"] }, { label: "Sides", help: "Fries, cheese curds, and snack sides", categories: ["Sides"] }, { label: "Sauces", help: "Dips and sauces", categories: ["Sauces"] }, { label: "Blizzards", help: "Small, medium, and large Blizzard macros", categories: ["Blizzards"] }, { label: "Shakes and drinks", help: "Shake, MooLatte, slush, and drink macros", categories: ["Shakes", "Drinks"] }, { label: "Sundaes and desserts", help: "Sundaes, cones, Dilly Bars, and other treats", categories: ["Desserts"] }], tip: "Dairy Queen is organized by grill food, sides, treats, and drinks so users do not have to dig through one giant menu." },
  cava: { meals: [{ name: "Build your own bowl", description: "Base, main, dips, toppings" }, { name: "Curated bowl", description: "Official CAVA bowl recipes" }, { name: "Pita", description: "Whole pita build" }, { name: "Sides and desserts", description: "Chips, pita, brownie" }], groups: [{ label: "Curated bowls", help: "Use official CAVA recipe macros when you order a named bowl", categories: ["Curated Bowls"] }, { label: "Bases", help: "Rice, lentils, greens, or whole pita", categories: ["Bases"] }, { label: "Mains", help: "Chicken, steak, falafel, lamb, salmon, or roasted vegetables", categories: ["Mains"] }, { label: "Dips and spreads", help: "Hummus, tzatziki, Crazy Feta, harissa, and more", categories: ["Dips"] }, { label: "Toppings", help: "Feta, cucumber, avocado, pita crisps, corn, and more", categories: ["Toppings"] }, { label: "Dressings", help: "Greek vinaigrette, tahini, skhug, and other dressings", categories: ["Dressings"] }, { label: "Sides and desserts", help: "Pita chips, pita, cookies, brownies, and drinks", categories: ["Sides", "Desserts", "Drinks"] }], tip: "CAVA has one of the best official nutrition PDFs for MacroMenu: ingredient-by-ingredient bowl building with calories, protein, carbs, and fat." },
  portillos: { meals: [{ name: "Hot dog", description: "Classic Chicago-style order" }, { name: "Italian beef", description: "Beef, sausage, combo, croissant" }, { name: "Burger", description: "Single or double burgers" }, { name: "Chicken and fish", description: "Sandwiches, fish, tenders" }, { name: "Salads and sides", description: "Fries, salads, sauces" }, { name: "Shakes and dessert", description: "Cake, shakes, drinks" }], groups: [{ label: "Hot dogs", help: "Classic hot dogs and sausage-style items", categories: ["Hot Dogs"] }, { label: "Italian beef and sausage", help: "Italian beef, big beef, Beef N Cheddar Croissant, sausage, bowls, and combos", categories: ["Beef & Sausage"] }, { label: "Burgers", help: "Burger rows use exact single and double macros where available", categories: ["Burgers"] }, { label: "Chicken and fish", help: "Chicken sandwiches, fish, and tenders", categories: ["Chicken & Fish"] }, { label: "Salads and sides", help: "Fries, onion rings, salads, soup, and sauces", categories: ["Sides", "Salads", "Sauces"] }, { label: "Shakes, desserts, and drinks", help: "Cake, shakes, chocolate cake shake, and fountain drinks", categories: ["Shakes", "Desserts", "Drinks"] }, { label: "Add-ons", help: "Cheese, peppers, gravy, and other tracked extras", categories: ["Add Ons"] }], tip: "Portillo's is now split into the sections people actually order from: hot dogs, beef/sausage, burgers, chicken/fish, sides, and dessert drinks." },
  wendys: { meals: [{ name: "Burgers", description: "Dave's Single, Double, Triple, Baconator" }, { name: "Chicken", description: "Spicy chicken, classic, grilled, nuggets" }, { name: "Salad", description: "Apple Pecan salad" }, { name: "Combo", description: "Entree + side + Frosty" }], groups: [{ label: "Burgers", help: "Dave's Single, Double, Triple, Baconator, Junior Bacon Cheeseburger", categories: ["Burgers"] }, { label: "Chicken and sandwiches", help: "Spicy chicken, classic chicken, grilled chicken, and nuggets", categories: ["Chicken & Sandwiches"] }, { label: "Salads", help: "Apple pecan and other salads", categories: ["Salads"] }, { label: "Sides", help: "Fries, chili, and baked potato — chili uses size buttons", categories: ["Sides"] }, { label: "Desserts", help: "Frosty — chocolate or vanilla, use size buttons", categories: ["Desserts"] }], tip: "Wendy's chili is a sleeper pick: the large is 370 calories with 25g protein. Pair with a burger for a solid combo without fries." },
  burgerking: { meals: [{ name: "Burgers", description: "Whopper, Double Whopper, Bacon King" }, { name: "Chicken", description: "Royal Crispy, Original Chicken, Nuggets" }, { name: "Breakfast", description: "Croissan'wich and hash browns" }, { name: "Combo", description: "Entree + side" }], groups: [{ label: "Burgers", help: "Whopper, Whopper Jr., Double Whopper, and Bacon King", categories: ["Burgers"] }, { label: "Chicken and sandwiches", help: "Royal Crispy, Spicy Royal Crispy, Original Chicken, Fish, and Nuggets", categories: ["Chicken", "Sandwiches"] }, { label: "Breakfast", help: "Croissan'wich sandwiches and hash browns", categories: ["Breakfast"] }, { label: "Sides", help: "French fries and onion rings — use size buttons", categories: ["Sides"] }], tip: "BK's Royal Crispy Chicken replaced the Ch'King as the flagship chicken sandwich. The Double Whopper at 920 calories is a true calorie bomb." },
  panera: { meals: [{ name: "Soup", description: "Broccoli cheddar, tomato, French onion, chicken noodle" }, { name: "Salad", description: "Fuji apple, Caesar, green goddess" }, { name: "Sandwich or flatbread", description: "Chipotle chicken, Turkey Bravo, and more" }, { name: "Soup and sandwich", description: "Classic Panera paired meal" }], groups: [{ label: "Soups", help: "Broccoli cheddar, creamy tomato, French onion, and chicken noodle — bowl size by default", categories: ["Soups"] }, { label: "Salads", help: "Full salads with grilled or crispy chicken", categories: ["Salads"] }, { label: "Sandwiches and flatbreads", help: "Hot and cold sandwiches and BBQ chicken flatbread", categories: ["Sandwiches", "Flatbreads"] }, { label: "Bakery", help: "Bagels, cookies, and pastries", categories: ["Bakery"] }], tip: "Panera soups use bowl macros by default. The BBQ Chicken Flatbread is a full 800-calorie item — not a light lunch add-on." },
  popeyes: { meals: [{ name: "Chicken sandwich", description: "Classic, Spicy, or Blackened Ranch" }, { name: "Bone-in chicken", description: "Breast, thigh, leg, wing — any mix" }, { name: "Tenders", description: "3 or 5 piece hand-battered tenders" }, { name: "Combo", description: "Chicken + sides" }], groups: [{ label: "Chicken sandwiches", help: "Classic, Spicy, and Blackened Ranch brioche bun sandwiches", categories: ["Chicken Sandwiches"] }, { label: "Bone-in chicken", help: "Mix any pieces — breast, thigh, wing, and leg tracked individually", categories: ["Chicken"] }, { label: "Tenders", help: "Hand-battered Louisiana chicken tenders", categories: ["Tenders"] }, { label: "Sides", help: "Red beans and rice, mac and cheese, biscuit, coleslaw, corn, green beans, mashed potatoes", categories: ["Sides"] }], tip: "Popeyes bone-in pieces vary dramatically: the breast alone hits 440 calories with 35g protein, while the leg is a lean 160 calories. Mix intentionally." },
  arbys: { meals: [{ name: "Roast beef", description: "Classic, Beef 'n Cheddar, double, or half pound" }, { name: "Sandwich or chicken", description: "Smokehouse brisket, crispy fish, or chicken" }, { name: "Combo", description: "Sandwich + side" }, { name: "Sides and shakes", description: "Curly fries, mozzarella sticks, shakes" }], groups: [{ label: "Roast beef", help: "Classic, Beef 'n Cheddar, double, and half pound — pick the one you ordered", categories: ["Roast Beef"] }, { label: "Sandwiches and chicken", help: "Smokehouse brisket, crispy fish, crispy or roast chicken", categories: ["Sandwiches", "Chicken"] }, { label: "Sides", help: "Curly fries, loaded curly fries, mozzarella sticks, and jalapeno bites", categories: ["Sides"] }, { label: "Shakes", help: "Jamocha and chocolate shakes — use size buttons", categories: ["Shakes"] }], tip: "Arby's curly fries are significantly higher in calories than most fast food fries — the large hits 650 calories. The roast chicken sandwich is one of the leanest options in fast food at 32g protein and 13g fat." },
  wingstop: { meals: [{ name: "Classic wings", description: "Bone-in wings, any flavor" }, { name: "Boneless wings", description: "Boneless pieces, any flavor" }, { name: "Combo", description: "Wings + fries + dips" }, { name: "Sides only", description: "Fries, loaded fries, veggie sticks" }], groups: [{ label: "Classic bone-in wings", help: "Each item is 5 wings. Use quantity to scale — 2 = 10 wings, 3 = 15 wings", categories: ["Classic Wings"] }, { label: "Boneless wings", help: "Each item is 6 boneless pieces. Scale with quantity", categories: ["Boneless Wings"] }, { label: "Sides", help: "Seasoned fries, loaded fries, and veggie sticks", categories: ["Sides"] }, { label: "Dipping sauces", help: "Ranch and bleu cheese — add per dip cup you use", categories: ["Dips"] }], tip: "Classic bone-in wings pack 50g protein per 5. Use quantity to scale — 10 wings is 2x the listed item." },
  raisingcanes: { meals: [{ name: "Combo meal", description: "3 or 4 fingers + fries + toast + sauce" }, { name: "Individual build", description: "Count fingers and sides separately" }, { name: "Sides and drinks", description: "Fries, coleslaw, toast, lemonade, sweet tea" }], groups: [{ label: "Chicken fingers", help: "Use quantity to track 1 through 6 fingers individually", categories: ["Chicken Fingers"] }, { label: "Combo meals", help: "Full combo meals with fries, toast, sauce, and a drink included", categories: ["Combos"] }, { label: "Sides", help: "Crinkle cut fries, Texas toast, and coleslaw", categories: ["Sides"] }, { label: "Sauces", help: "Cane's sauce — track each 1 oz serving separately", categories: ["Sauces"] }, { label: "Drinks", help: "Lemonade and sweet tea — use size buttons", categories: ["Drinks"] }], tip: "Cane's sauce adds 190 calories and 18g fat per oz. Track every packet — it adds up fast. The Caniac Combo is 1790 calories total." },
};

const mealGroupRules: Record<string, Record<string, string[]>> = {
  panda: {
    "Bowl": ["Choose your entrees", "Choose your sides"],
    "Plate": ["Choose your entrees", "Choose your sides"],
    "Bigger Plate": ["Choose your entrees", "Choose your sides"],
    "A la Carte": ["Choose your entrees", "Choose your sides", "Extras"],
  },
  chipotle: {
    "Bowl": ["Choose your protein", "Rice", "Beans", "Toppings", "Sides and extras"],
    "Burrito": ["Choose your protein", "Rice", "Beans", "Toppings", "Sides and extras"],
    "Salad": ["Choose your protein", "Rice", "Beans", "Toppings", "Sides and extras"],
    "Tacos": ["Choose your protein", "Rice", "Beans", "Toppings", "Sides and extras"],
    "Kid's Meal": ["Kids base", "Kids protein", "Kids rice and beans", "Kids toppings", "Kids fruit, chips, and drinks"],
  },
  chickfila: {
    "Entree": ["Choose your entree", "Sauces"],
    "Combo": ["Choose your entree", "Choose your sides", "Sauces", "Drinks"],
    "Sides & Treats": ["Choose your sides", "Sauces", "Drinks"],
  },
  potbelly: {
    "Build your own sandwich": ["Choose your bread", "Choose meats", "Choose cheese", "Spreads and toppings", "Customize it"],
    "Toasty favorite": ["Premade favorites and sides", "Customize it"],
    "Pick-your-pair": ["Premade favorites and sides"],
  },
  jimmyjohns: {
    "Build your own sandwich": ["Choose your bread", "Choose meats", "Choose cheese", "Spreads", "Toppings", "Customize it"],
    "Original 8-inch": ["Choose your bread", "Choose meats", "Choose cheese", "Spreads", "Toppings", "Customize it", "Premade favorites"],
    "Unwich": ["Choose your bread", "Choose meats", "Choose cheese", "Spreads", "Toppings", "Customize it"],
  },
  jerseymikes: {
    "Build your own sub": ["Choose your bread", "Choose meats", "Choose cheese", "Spreads and Mike's Way"],
    "Regular sub": ["Choose your bread", "Choose meats", "Choose cheese", "Spreads and Mike's Way", "Premade favorites"],
    "Sub in a Tub": ["Choose your bread", "Choose meats", "Choose cheese", "Spreads and Mike's Way"],
  },
  mcdonalds: {
    "Combo meal": ["Burgers", "Chicken, fish, and nuggets", "Customize it", "Sides", "Drinks", "Sauces and desserts"],
    "Burgers": ["Burgers", "Customize it", "Sauces and desserts"],
    "Chicken and nuggets": ["Chicken, fish, and nuggets", "Customize it", "Sauces and desserts"],
    "Breakfast": ["Breakfast", "Drinks", "McCafe"],
    "Drinks and sweets": ["Drinks", "McCafe", "Sauces and desserts"],
  },
  culvers: {
    "Value basket": ["ButterBurgers", "Chicken, fish, and baskets", "Customize it", "Sides", "Drinks and sauces"],
    "ButterBurger": ["ButterBurgers", "Customize it", "Sides", "Drinks and sauces"],
    "Chicken and seafood": ["Chicken, fish, and baskets", "Customize it", "Sides", "Drinks and sauces"],
    "Sides and salads": ["Sides", "Salads and soup", "Drinks and sauces"],
    "Custard run": ["Frozen custard"],
  },
  starbucks: {
    "Coffee": ["Coffee", "Customize it"],
    "Espresso drink": ["Espresso", "Customize it"],
    "Refresher": ["Refreshers", "Customize it"],
    "Tea and matcha": ["Tea and matcha", "Customize it"],
    "Frappuccino": ["Frappuccino", "Customize it"],
    "Food": ["Food"],
  },
  tacobell: {
    "Taco": ["Start with a base", "Protein and beans", "Toppings", "Customize it", "Sauces"],
    "Burrito": ["Start with a base", "Protein and beans", "Rice, potatoes, and cheese", "Toppings", "Customize it", "Sauces"],
    "Bowl or power menu": ["Start with a base", "Protein and beans", "Rice, potatoes, and cheese", "Toppings", "Customize it", "Sauces"],
    "Crunchwrap or quesadilla": ["Start with a base", "Protein and beans", "Rice, potatoes, and cheese", "Toppings", "Customize it", "Sauces"],
    "Combo": ["Start with a base", "Protein and beans", "Rice, potatoes, and cheese", "Toppings", "Customize it", "Sauces", "Sides, sweets, and drinks"],
  },
  subway: {
    "Build your own sub": ["Choose bread", "Choose protein", "Cheese", "Veggies and toppings", "Sauces"],
    "Protein bowl or salad": ["Choose protein", "Cheese", "Veggies and toppings", "Sauces"],
    "Named sandwiches": ["Sandwich baselines", "Cheese", "Veggies and toppings", "Sauces"],
    "Sides and sweets": ["Desserts and sides"],
  },
  fiveguys: {
    "Build your own burger": ["Start with bread", "Patties", "Cheese and bacon", "Toppings", "Sauces"],
    "Fries": ["Fries"],
    "Shake": ["Shakes"],
    "Hot dog or extras": ["Patties", "Cheese and bacon", "Toppings", "Sauces"],
  },
  shakeshack: {
    "Burgers": ["Burgers", "Burger components"],
    "Chicken": ["Chicken"],
    "Fries": ["Sides"],
    "Shakes and drinks": ["Shakes", "Drinks"],
  },
  dairyqueen: {
    "Burgers and chicken": ["Burgers", "Hot dogs", "Chicken and fish", "Sauces"],
    "Sides": ["Sides", "Sauces"],
    "Blizzards": ["Blizzards"],
    "Shakes and drinks": ["Shakes and drinks"],
    "Sundaes and desserts": ["Sundaes and desserts"],
  },
  cava: {
    "Build your own bowl": ["Bases", "Mains", "Dips and spreads", "Toppings", "Dressings"],
    "Curated bowl": ["Curated bowls"],
    "Pita": ["Bases", "Mains", "Dips and spreads", "Toppings", "Dressings"],
    "Sides and desserts": ["Sides and desserts"],
  },
  portillos: {
    "Hot dog": ["Hot dogs", "Add-ons"],
    "Italian beef": ["Italian beef and sausage", "Add-ons"],
    "Burger": ["Burgers", "Add-ons"],
    "Chicken and fish": ["Chicken and fish", "Add-ons"],
    "Salads and sides": ["Salads and sides", "Add-ons"],
    "Shakes and dessert": ["Shakes, desserts, and drinks"],
  },
  wendys: {
    "Burgers": ["Burgers", "Sides"],
    "Chicken": ["Chicken and sandwiches", "Sides"],
    "Salad": ["Salads"],
    "Combo": ["Burgers", "Chicken and sandwiches", "Salads", "Sides", "Desserts"],
  },
  burgerking: {
    "Burgers": ["Burgers", "Sides"],
    "Chicken": ["Chicken and sandwiches", "Sides"],
    "Breakfast": ["Breakfast"],
    "Combo": ["Burgers", "Chicken and sandwiches", "Breakfast", "Sides"],
  },
  panera: {
    "Soup": ["Soups"],
    "Salad": ["Salads"],
    "Sandwich or flatbread": ["Sandwiches and flatbreads"],
    "Soup and sandwich": ["Soups", "Sandwiches and flatbreads"],
  },
  popeyes: {
    "Chicken sandwich": ["Chicken sandwiches", "Sides"],
    "Bone-in chicken": ["Bone-in chicken", "Sides"],
    "Tenders": ["Tenders", "Sides"],
    "Combo": ["Chicken sandwiches", "Bone-in chicken", "Tenders", "Sides"],
  },
  arbys: {
    "Roast beef": ["Roast beef", "Sides"],
    "Sandwich or chicken": ["Sandwiches and chicken", "Sides"],
    "Combo": ["Roast beef", "Sandwiches and chicken", "Sides"],
    "Sides and shakes": ["Sides", "Shakes"],
  },
  wingstop: {
    "Classic wings": ["Classic bone-in wings", "Dipping sauces"],
    "Boneless wings": ["Boneless wings", "Dipping sauces"],
    "Combo": ["Classic bone-in wings", "Boneless wings", "Sides", "Dipping sauces"],
    "Sides only": ["Sides", "Dipping sauces"],
  },
  raisingcanes: {
    "Combo meal": ["Combo meals", "Sauces"],
    "Individual build": ["Chicken fingers", "Sides", "Sauces", "Drinks"],
    "Sides and drinks": ["Sides", "Drinks"],
  },
};

function RestaurantBuilder({ restaurantId, meal, setMeal, selected, addItem, removeItem, updateQuantity, jerseySize, setJerseySize, subwaySize, setSubwaySize, starbucksSize, setStarbucksSize }: {
  restaurantId: string; meal: string | null; setMeal: (meal: string | null) => void; selected: Selected[];
  addItem: (item: MenuItem) => void; removeItem: (id: string) => void; updateQuantity: (id: string, quantity: number) => void;
  jerseySize: (typeof jerseyMikesSizes)[number]["label"]; setJerseySize: (size: (typeof jerseyMikesSizes)[number]["label"]) => void;
  subwaySize: (typeof subwaySizes)[number]["label"]; setSubwaySize: (size: (typeof subwaySizes)[number]["label"]) => void;
  starbucksSize: (typeof starbucksSizes)[number]["label"]; setStarbucksSize: (size: (typeof starbucksSizes)[number]["label"]) => void;
}) {
  const config = builderConfigs[restaurantId];
  const restaurant = restaurants.find(item => item.id === restaurantId)!;
  if (!config) return (
    <div className="flex flex-col items-center justify-center h-48 rounded-[14px] border border-dashed border-[#d4e0d0] dark:border-[#2c3a35] text-center p-8">
      <p className="m-0 font-semibold text-[15px]">Full builder coming soon</p>
      <p className="mt-2 mb-0 text-muted text-[13px]">Your macro pick is loaded - check the panel on the right for totals.</p>
    </div>
  );
  const currentMeal = meal ? config.meals.find(choice => choice.name === meal) : null;
  const activeGroupLabels = meal ? currentMeal?.groupLabels ?? mealGroupRules[restaurantId]?.[meal] : null;
  const visibleGroups = config.groups
    .filter(group => !meal || !group.showWhen || group.showWhen.includes(meal))
    .filter(group => !activeGroupLabels || activeGroupLabels.includes(group.label));
  const chooseMeal = (choice: MealChoice) => {
    config.meals.flatMap(option => option.baseIds ?? []).forEach(removeItem);
    choice.baseIds?.forEach(id => addItem(menuItems.find(item => item.id === id)!));
    setMeal(choice.name);
  };

  if (!meal) return (
    <div>
      {/* Catalog Head */}
      <div className="flex items-end justify-between">
        <div>
          <span className="block mb-[7px] text-green text-[10px] font-bold tracking-[0.14em]">STEP 1 OF 2</span>
          <h2 className="m-0 font-display font-extrabold text-[26px] tracking-[-1px]">What are you building?</h2>
          <p className="mt-[6px] mb-0 text-muted text-[13px]">Choose a meal type, then make it match your actual {restaurant.name} order.</p>
        </div>
      </div>

      {/* Meal Type Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-6">
        {config.meals.map(choice => (
          <button
            key={choice.name}
            onClick={() => chooseMeal(choice)}
            className="grid grid-cols-[44px_1fr_20px] items-center gap-[10px] p-[18px] text-left bg-card dark:bg-[#18231f] border border-line dark:border-[#2c3a35] rounded-[13px] transition-all duration-200 hover:-translate-y-[3px] hover:border-[#b5d5be] hover:shadow-card"
          >
            <span className="grid place-items-center w-10 h-10 text-green bg-[#edf7ee] dark:bg-[#24382f] rounded-[11px]"><Utensils size={21} /></span>
            <div>
              <b className="block font-display font-bold text-[15px]">{choice.name}</b>
              <small className="block mt-[3px] text-muted text-[11px]">{choice.description}</small>
            </div>
            <ArrowRight size={17} className="text-green" />
          </button>
        ))}
      </div>

      <div className="flex gap-[9px] mt-4 p-[14px] text-[#587068] bg-[#eef6ef] dark:bg-[#20332a] border border-[#dcebdd] dark:border-[#2c3a35] rounded-[10px] text-xs leading-[1.5]">
        <Sparkles size={15} className="flex-none text-green" />
        <span><b>Built for real orders.</b> {config.tip}</span>
      </div>
    </div>
  );

  return (
    <div>
      {/* Builder Head */}
      <div className="flex items-center justify-between">
        <div>
          <span className="block mb-[7px] text-green text-[10px] font-bold tracking-[0.14em]">STEP 2 OF 2</span>
          <h2 className="m-0 font-display font-extrabold text-[26px] tracking-[-1px]">
            {meal.toLowerCase().includes("build") ? meal : `Build your ${meal.toLowerCase()}`}
          </h2>
          <p className="mt-[6px] mb-0 text-muted text-[13px]">Tap an item, then choose a portion. Customize it the way you really order it.</p>
        </div>
        <button onClick={() => setMeal(null)} className="flex items-center gap-[3px] text-green text-xs font-bold">
          <ChevronLeft size={15} /> Change meal
        </button>
      </div>

      {/* Selected Base */}
      <div className="flex items-center gap-[9px] mt-[18px] p-[13px] bg-[#f2f8f2] dark:bg-[#20332a] border border-[#dcebdd] dark:border-[#2c3a35] rounded-[10px]">
        <span className="grid place-items-center w-5 h-5 bg-green text-white rounded-full"><Check size={15} /></span>
        <div>
          <b className="block font-display font-bold text-[13px]">{meal}</b>
          <small className="block mt-[2px] text-muted text-[11px]">{restaurant.name} custom order</small>
        </div>
      </div>

      {/* Size Selectors */}
      {restaurantId === "jerseymikes" && (
        <div className="flex justify-between items-center gap-[14px] mt-[14px] p-[13px] bg-white dark:bg-card border border-line dark:border-[#2c3a35] rounded-[10px]">
          <div>
            <b className="block font-display font-bold text-[13px]">Choose sandwich size</b>
            <small className="block mt-[3px] text-muted text-[11px]">Macros scale from the regular-size baseline.</small>
          </div>
          <div className="grid grid-cols-3 gap-[5px] min-w-[315px]">
            {jerseyMikesSizes.map(size => (
              <button
                key={size.label}
                onClick={() => setJerseySize(size.label)}
                className={cn(
                  "px-[10px] py-2 rounded-lg text-left",
                  jerseySize === size.label ? "bg-green text-white" : "bg-[#f3f5f2] dark:bg-[#22302b] text-[#78857e]"
                )}
              >
                <b className="block text-xs">{size.label}</b>
                <small className="block mt-[2px] text-[9px] opacity-80">{size.description}</small>
              </button>
            ))}
          </div>
        </div>
      )}
      {restaurantId === "subway" && (
        <div className="flex justify-between items-center gap-[14px] mt-[14px] p-[13px] bg-white dark:bg-card border border-line dark:border-[#2c3a35] rounded-[10px]">
          <div>
            <b className="block font-display font-bold text-[13px]">Choose sandwich size</b>
            <small className="block mt-[3px] text-muted text-[11px]">Footlong doubles bread, proteins, cheese, toppings, and sauces from the 6-inch baseline.</small>
          </div>
          <div className="grid grid-cols-3 gap-[5px] min-w-[315px]">
            {subwaySizes.map(size => (
              <button
                key={size.label}
                onClick={() => setSubwaySize(size.label)}
                className={cn(
                  "px-[10px] py-2 rounded-lg text-left",
                  subwaySize === size.label ? "bg-green text-white" : "bg-[#f3f5f2] dark:bg-[#22302b] text-[#78857e]"
                )}
              >
                <b className="block text-xs">{size.label}</b>
                <small className="block mt-[2px] text-[9px] opacity-80">{size.description}</small>
              </button>
            ))}
          </div>
        </div>
      )}
      {restaurantId === "starbucks" && (
        <div className="flex justify-between items-center gap-[14px] mt-[14px] p-[13px] bg-white dark:bg-card border border-line dark:border-[#2c3a35] rounded-[10px]">
          <div>
            <b className="block font-display font-bold text-[13px]">Choose drink size</b>
            <small className="block mt-[3px] text-muted text-[11px]">Applies to coffee, espresso, refreshers, tea, frappes, and customizations.</small>
          </div>
          <div className="grid grid-cols-3 gap-[5px] min-w-[315px]">
            {starbucksSizes.map(size => (
              <button
                key={size.label}
                onClick={() => setStarbucksSize(size.label)}
                className={cn(
                  "px-[10px] py-2 rounded-lg text-left",
                  starbucksSize === size.label ? "bg-green dark:bg-green text-white" : "bg-[#f3f5f2] dark:bg-[#22302b] text-[#78857e]"
                )}
              >
                <b className="block text-xs">{size.label}</b>
                <small className="block mt-[2px] text-[9px] opacity-80">{size.description}</small>
              </button>
            ))}
          </div>
        </div>
      )}

      <div className={cn(restaurantId === "chipotle" && meal !== "Kid's Meal" && "grid grid-cols-[minmax(0,1fr)_300px] gap-4 items-start")}>
        <div>
          {visibleGroups.filter(group => group.variant !== "extras").map(group => (
            <section
              key={group.label}
              className={cn(
                "mt-[18px] bg-card dark:bg-[#18231f] border border-line dark:border-[#2c3a35] rounded-xl overflow-hidden",
                group.variant === "kids" && "border-[#f2d7a0] bg-[#fffaf0] dark:bg-[#2a251b] dark:border-[#5d4728]"
              )}
            >
              <header className={cn(
                "px-[15px] py-[13px] bg-[#f7f9f6] border-b border-line dark:border-[#2c3a35]",
                group.variant === "kids" && "bg-[#fff3d8] dark:bg-[#322817]"
              )}>
                <div>
                  <h3 className="m-0 font-display font-bold text-[15px]">{group.label}</h3>
                  <p className="mt-[3px] mb-0 text-muted text-[11px]">{group.help}</p>
                </div>
              </header>
              <div>
                {menuItems.filter(item => item.restaurantId === restaurantId && group.categories.includes(item.category)).map(item => {
                  const quantity = selected.find(row => row.item.id === item.id)?.quantity ?? 0;
                  return (
                    <article
                      key={item.id}
                      className={cn(
                        "grid grid-cols-[minmax(190px,1fr)_255px_210px] gap-3 items-center px-[13px] py-[11px] border-b border-line dark:border-[#2c3a35] transition-all duration-150 last:border-0",
                        quantity && "bg-[#fbfefb] dark:bg-[#20332a]",
                        quantity && group.variant === "kids" && "bg-[#fff7e6] dark:bg-[#332918]"
                      )}
                    >
                      <button
                        className="flex items-center gap-[9px] text-left"
                        onClick={() => quantity ? removeItem(item.id) : addItem(item)}
                      >
                        <span className={cn(
                          "grid place-items-center flex-none w-[23px] h-[23px] text-[#99a69f] border border-[#d5dcd7] rounded-full",
                          quantity && "text-white bg-green border-green",
                          !quantity && group.variant === "kids" && "border-[#e5c372]",
                          quantity && group.variant === "kids" && "bg-[#c47b19] border-[#c47b19]"
                        )}>
                          {quantity ? <Check size={14} /> : <Plus size={14} />}
                        </span>
                        <span>
                          <b className="block text-xs">{item.name}</b>
                          <small className="block mt-[3px] text-muted text-[10px]">{item.description}</small>
                        </span>
                      </button>
                      <div className="m-0 p-0 border-0 flex gap-0">
                        <span className="w-1/4 flex flex-col gap-[2px]"><b className="text-[13px]">{item.calories}</b><small className="text-[#96a19c] text-[8px] uppercase tracking-[0.04em]">cal</small></span>
                        <span className="w-1/4 flex flex-col gap-[2px]"><b className="text-[13px]">{item.protein}g</b><small className="text-[#96a19c] text-[8px] uppercase tracking-[0.04em]">protein</small></span>
                        <span className="w-1/4 flex flex-col gap-[2px]"><b className="text-[13px]">{item.carbs}g</b><small className="text-[#96a19c] text-[8px] uppercase tracking-[0.04em]">carbs</small></span>
                        <span className="w-1/4 flex flex-col gap-[2px]"><b className="text-[13px]">{item.fat}g</b><small className="text-[#96a19c] text-[8px] uppercase tracking-[0.04em]">fat</small></span>
                      </div>
                      <ItemControls item={item} quantity={quantity} removeItem={removeItem} updateQuantity={updateQuantity} />
                    </article>
                  );
                })}
              </div>
            </section>
          ))}
        </div>

        {/* Extras Column (Chipotle) */}
        {restaurantId === "chipotle" && meal !== "Kid's Meal" && (
          <aside className="sticky top-[88px]">
            {visibleGroups.filter(group => group.variant === "extras").map(group => (
              <section
                key={group.label}
                className="mt-[18px] bg-[#fbfefb] dark:bg-[#1c2a24] border border-[#d9e6d8] dark:border-[#2c3a35] rounded-xl overflow-hidden"
              >
                <header className="px-[15px] py-[13px] bg-[#edf7ee] dark:bg-[#23352d] border-b border-line dark:border-[#2c3a35]">
                  <div>
                    <h3 className="m-0 font-display font-bold text-[15px]">{group.label}</h3>
                    <p className="mt-[3px] mb-0 text-muted text-[11px]">{group.help}</p>
                  </div>
                </header>
                <div>
                  {menuItems.filter(item => item.restaurantId === restaurantId && group.categories.includes(item.category)).map(item => {
                    const quantity = selected.find(row => row.item.id === item.id)?.quantity ?? 0;
                    return (
                      <article
                        key={item.id}
                        className={cn(
                          "block px-[13px] py-[11px] border-b border-line dark:border-[#2c3a35] transition-all duration-150 last:border-0",
                          quantity && "bg-[#fbfefb] dark:bg-[#20332a]"
                        )}
                      >
                        <button
                          className="flex items-center gap-[9px] text-left w-full"
                          onClick={() => quantity ? removeItem(item.id) : addItem(item)}
                        >
                          <span className={cn(
                            "grid place-items-center flex-none w-[23px] h-[23px] text-[#99a69f] border border-[#d5dcd7] rounded-full",
                            quantity && "text-white bg-green border-green"
                          )}>
                            {quantity ? <Check size={14} /> : <Plus size={14} />}
                          </span>
                          <span>
                            <b className="block text-xs">{item.name}</b>
                            <small className="block mt-[3px] text-muted text-[10px]">{item.description}</small>
                          </span>
                        </button>
                        <div className="mx-0 my-[10px] mb-2 py-2 border-t border-b border-line dark:border-[#2c3a35] flex gap-0">
                          <span className="w-1/4 flex flex-col gap-[2px]"><b className="text-[13px]">{item.calories}</b><small className="text-[#96a19c] text-[8px] uppercase tracking-[0.04em]">cal</small></span>
                          <span className="w-1/4 flex flex-col gap-[2px]"><b className="text-[13px]">{item.protein}g</b><small className="text-[#96a19c] text-[8px] uppercase tracking-[0.04em]">protein</small></span>
                          <span className="w-1/4 flex flex-col gap-[2px]"><b className="text-[13px]">{item.carbs}g</b><small className="text-[#96a19c] text-[8px] uppercase tracking-[0.04em]">carbs</small></span>
                          <span className="w-1/4 flex flex-col gap-[2px]"><b className="text-[13px]">{item.fat}g</b><small className="text-[#96a19c] text-[8px] uppercase tracking-[0.04em]">fat</small></span>
                        </div>
                        <div className="mt-1">
                          <ItemControls item={item} quantity={quantity} removeItem={removeItem} updateQuantity={updateQuantity} />
                        </div>
                      </article>
                    );
                  })}
                </div>
              </section>
            ))}
          </aside>
        )}
      </div>
    </div>
  );
}

function ItemControls({ item, quantity, removeItem, updateQuantity }: {
  item: MenuItem; quantity: number; removeItem: (id: string) => void; updateQuantity: (id: string, quantity: number) => void;
}) {
  if (item.control === "toggle") return (
    <div className="grid grid-cols-3 gap-[3px] p-[3px] bg-[#f3f5f2] dark:bg-[#22302b] rounded-[7px]">
      <button
        className={cn("px-[3px] py-[6px] text-[#89948e] rounded-[5px] text-[9px] text-center", quantity === 0 && "text-green bg-white dark:bg-[#31413b] shadow-[0_1px_4px_#263f3214] font-bold")}
        onClick={() => removeItem(item.id)}
      >No</button>
      <button
        className={cn("px-[3px] py-[6px] text-[#89948e] rounded-[5px] text-[9px] text-center", quantity === 1 && "text-green bg-white dark:bg-[#31413b] shadow-[0_1px_4px_#263f3214] font-bold")}
        onClick={() => updateQuantity(item.id, 1)}
      >Apply</button>
    </div>
  );

  if (item.control === "size") return (
    <div className="grid grid-cols-3 gap-[3px] p-[3px] bg-[#f3f5f2] dark:bg-[#22302b] rounded-[7px]" style={{ gridTemplateColumns: `repeat(4, 1fr)` }}>
      <button
        className={cn("px-[3px] py-[6px] text-[#89948e] rounded-[5px] text-[9px] text-center", quantity === 0 && "text-green bg-white dark:bg-[#31413b] shadow-[0_1px_4px_#263f3214] font-bold")}
        onClick={() => removeItem(item.id)}
      >None</button>
      {itemSizeOptions.map(size => (
        <button
          key={size.label}
          className={cn("px-[3px] py-[6px] text-[#89948e] rounded-[5px] text-[9px] text-center", quantity === size.value && "bg-green text-white")}
          onClick={() => updateQuantity(item.id, size.value)}
        >{size.label}</button>
      ))}
    </div>
  );

  if (item.control === "quantity" || quantityCategories.includes(item.category)) return (
    <div className="grid grid-cols-3 gap-[3px] p-[3px] bg-[#f3f5f2] dark:bg-[#22302b] rounded-[7px]" style={{ gridTemplateColumns: `repeat(4, 1fr)` }}>
      <button
        className={cn("px-[3px] py-[6px] text-[#89948e] rounded-[5px] text-[9px] text-center", quantity === 0 && "text-green bg-white dark:bg-[#31413b] shadow-[0_1px_4px_#263f3214] font-bold")}
        onClick={() => removeItem(item.id)}
      >None</button>
      {[1, 2, 3].map(value => (
        <button
          key={value}
          className={cn("px-[3px] py-[6px] text-[#89948e] rounded-[5px] text-[9px] text-center", quantity === value && "bg-green text-white")}
          onClick={() => updateQuantity(item.id, value)}
        >{value === 1 ? "1 item" : `${value} items`}</button>
      ))}
    </div>
  );

  return (
    <div className="grid grid-cols-3 gap-[3px] p-[3px] bg-[#f3f5f2] dark:bg-[#22302b] rounded-[7px]" style={{ gridTemplateColumns: `repeat(4, 1fr)` }}>
      {[0, .5, 1, 2].map(value => (
        <button
          key={value}
          className={cn("px-[3px] py-[6px] text-[#89948e] rounded-[5px] text-[9px] text-center", quantity === value && "text-green bg-white dark:bg-[#31413b] shadow-[0_1px_4px_#263f3214] font-bold")}
          onClick={() => value === 0 ? removeItem(item.id) : updateQuantity(item.id, value)}
        >{value === 0 ? "None" : value === .5 ? "Light" : value === 1 ? "Regular" : "Double"}</button>
      ))}
    </div>
  );
}

function MealPanel({ selected, totals, portion, setPortion, removeItem, updateQuantity, saved, setSaved, officialBaseline, isDrawer = false }: {
  selected: Selected[]; totals: Macro; portion: keyof typeof portionMultipliers;
  setPortion: (value: keyof typeof portionMultipliers) => void; removeItem: (id: string) => void;
  updateQuantity: (id: string, value: number) => void; saved: boolean; setSaved: (value: boolean) => void; officialBaseline: boolean;
  isDrawer?: boolean;
}) {
  return (
    <aside className={cn(
      "h-max p-4 bg-white dark:bg-[#18231f] border border-line dark:border-[#2c3a35] rounded-[14px] shadow-[0_9px_27px_#3d5e4e12]",
      !isDrawer && "sticky top-20"
    )}>
      {/* Panel Header */}
      <div className="flex items-center justify-between">
        <div>
          <span className="text-green text-[9px] font-bold tracking-[0.14em]">YOUR MEAL</span>
          <h2 className="mt-[3px] mb-0 font-display font-extrabold text-[18px]">Meal builder</h2>
        </div>
        <button
          className="text-[#97a29d] text-[11px]"
          onClick={() => selected.forEach(row => removeItem(row.item.id))}
        >
          Clear
        </button>
      </div>

      {/* Portion Box */}
      <div className="mt-[14px] p-[10px] rounded-[9px] bg-[#f6f8f5] dark:bg-[#23312c]">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[11px] font-bold">Portion estimate</span>
          <small className="text-[9px] text-[#929d97]">Adjust for restaurant portions</small>
        </div>
        <div className="grid grid-cols-3 gap-1">
          {Object.keys(portionMultipliers).map(item => (
            <button
              key={item}
              onClick={() => setPortion(item as keyof typeof portionMultipliers)}
              className={cn(
                "py-[5px] rounded-[5px] text-[#86928c] text-[10px]",
                portion === item && "bg-white dark:bg-[#31413b] text-green shadow-[0_1px_4px_#263f3213] font-bold"
              )}
            >
              {item}
            </button>
          ))}
        </div>
      </div>

      {/* Meal Items */}
      <div className="py-[6px]">
        {!selected.length && (
          <div className="flex items-center flex-col gap-[5px] py-[30px] text-[#a3ada8]">
            <ShoppingBag size={25} />
            <b className="text-[#7b8882] text-xs">Your meal is empty</b>
            <span className="text-[11px]">Add menu items to start tracking.</span>
          </div>
        )}
        {selected.map(({ item, quantity }) => {
          const rowMacro = macroForSelection(item, quantity);
          const sizeLabel = item.control === "size" ? item.sizeMacros?.find(size => size.value === quantity)?.label : null;
          return (
            <div key={item.id} className="grid grid-cols-[20px_1fr_15px] gap-[7px] py-[10px] border-b border-line dark:border-[#2c3a35]">
              <span className="grid place-items-center w-[17px] h-[17px] text-white bg-green rounded-full"><Check size={13} /></span>
              <div>
                <b className="block text-[11px]">{item.name}</b>
                <small className="block mt-[3px] text-[#98a19d] text-[10px]">{round(rowMacro.calories)} cal · {round(rowMacro.protein)}g protein</small>
                <div className="flex gap-[5px] items-center mt-[7px]">
                  {item.control === "toggle" || item.control === "size" ? (
                    <span className="text-[#77847e] text-[10px]">{sizeLabel ?? "applied"}</span>
                  ) : (
                    <>
                      <button
                        onClick={() => updateQuantity(item.id, quantity - .5)}
                        className="w-[17px] h-[17px] leading-[14px] border border-line dark:border-[#34433e] rounded-[4px] text-[#6e7c75] bg-white dark:bg-[#22302b]"
                      >−</button>
                      <span className="text-[#77847e] text-[10px]">{quantity}x</span>
                      <button
                        onClick={() => updateQuantity(item.id, quantity + .5)}
                        className="w-[17px] h-[17px] leading-[14px] border border-line dark:border-[#34433e] rounded-[4px] text-[#6e7c75] bg-white dark:bg-[#22302b]"
                      >+</button>
                    </>
                  )}
                </div>
              </div>
              <button aria-label="Remove item" onClick={() => removeItem(item.id)} className="text-[#adb6b1]">
                <Trash2 size={15} />
              </button>
            </div>
          );
        })}
      </div>

      {/* Totals */}
      <div className="p-3 mt-[9px] rounded-[9px] bg-[#f0f7f0] dark:bg-[#23312c]">
        <div className="flex justify-between items-center">
          <span className="text-[#7f9188] text-[9px] font-bold tracking-[0.08em]">TOTAL CALORIES</span>
          <b className="font-display font-extrabold text-[26px] text-green">{round(totals.calories)}</b>
        </div>
        <div className="grid grid-cols-3 mt-[7px] pt-2 border-t border-[#dce8dd] dark:border-[#2c3a35]">
          <span className="flex flex-col gap-[2px]">
            <b className="text-sm">{round(totals.protein)}g</b>
            <small className="text-[#7f9188] text-[9px] font-bold tracking-[0.08em]">PROTEIN</small>
          </span>
          <span className="flex flex-col gap-[2px]">
            <b className="text-sm">{round(totals.carbs)}g</b>
            <small className="text-[#7f9188] text-[9px] font-bold tracking-[0.08em]">CARBS</small>
          </span>
          <span className="flex flex-col gap-[2px]">
            <b className="text-sm">{round(totals.fat)}g</b>
            <small className="text-[#7f9188] text-[9px] font-bold tracking-[0.08em]">FAT</small>
          </span>
        </div>
      </div>

      {/* Save Button */}
      <button
        onClick={() => setSaved(!saved)}
        className={cn(
          "w-full h-[41px] mt-[11px] flex justify-center items-center gap-[7px] rounded-lg text-xs font-bold",
          saved ? "bg-[#e9f6ed] text-green" : "bg-green text-white"
        )}
      >
        {saved ? <Check size={17} /> : <Bookmark size={17} />} {saved ? "Meal saved" : "Save this meal"}
      </button>

      {/* Meal Note */}
      <p className="flex gap-[5px] items-start mt-[11px] mb-0 text-[#a2aaa6] text-[9px] leading-[1.4]">
        <Sparkles size={13} /> {officialBaseline ? "Baseline macros use published restaurant nutrition data. Portion adjustments are estimates." : "Nutrition preview data is being audited against official restaurant sources."}
      </p>
    </aside>
  );
}
