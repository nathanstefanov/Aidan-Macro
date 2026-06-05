"use client";

import { useMemo, useState } from "react";
import {
  ArrowRight, Bookmark, Check, ChevronLeft, ChevronRight, Flame,
  Heart, Moon, Plus, Search, ShoppingBag, Sparkles, Sun,
  Trash2, UserRound, Utensils, X, Zap
} from "lucide-react";
import { macroForSelection, macroTotal, menuItems, restaurants, type Macro, type MenuItem } from "../lib/data";

type Selected = { item: MenuItem; quantity: number };
type View = "home" | "restaurant";
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
  { label: "Build-your-own", description: "Bowls, subs, tacos, burgers", ids: ["chipotle", "subway", "jerseymikes", "tacobell"] },
  { label: "Fast food staples", description: "Burgers, chicken, fries", ids: ["mcdonalds", "culvers", "fiveguys", "dairyqueen"] },
  { label: "Coffee and drinks", description: "Coffee, refreshers, shakes", ids: ["starbucks", "dairyqueen", "portillos", "shakeshack"] },
] as const;

function Logo({ id, small = false }: { id: string; small?: boolean }) {
  const restaurant = restaurants.find(r => r.id === id)!;
  const [loaded, setLoaded] = useState(false);
  return (
    <span className={`brand-logo ${loaded ? "brand-logo-loaded" : ""} ${small ? "brand-logo-small" : ""}`} style={{ background: restaurant.color }}>
      <img src={restaurant.logoUrl} alt={`${restaurant.name} logo`} loading="lazy" onLoad={() => setLoaded(true)} onError={() => setLoaded(false)} />
      <b>{restaurant.short}</b>
      <small>{restaurant.logo}</small>
    </span>
  );
}

function MacroStats({ macro, multiplier = 1 }: { macro: Macro; multiplier?: number }) {
  return (
    <div className="macro-stats">
      <span><b>{round(macro.calories * multiplier)}</b><small>cal</small></span>
      <span><b>{round(macro.protein * multiplier)}g</b><small>protein</small></span>
      <span><b>{round(macro.carbs * multiplier)}g</b><small>carbs</small></span>
      <span><b>{round(macro.fat * multiplier)}g</b><small>fat</small></span>
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
  const addItem = (item: MenuItem) => setSelected(current => current.some(row => row.item.id === item.id) ? current : [...current, { item, quantity: 1 }]);
  const removeItem = (id: string) => setSelected(current => current.filter(row => row.item.id !== id));
  const updateQuantity = (id: string, quantity: number) => quantity <= 0 ? removeItem(id) : setSelected(current => current.some(row => row.item.id === id) ? current.map(row => row.item.id === id ? { ...row, quantity } : row) : [...current, { item: menuItems.find(item => item.id === id)!, quantity }]);

  return (
    <main className={dark ? "dark app" : "app"}>
      <header className="site-header">
        <div className="shell header-inner">
          <button className="logo" onClick={() => setView("home")}><span><Flame size={17} fill="currentColor" /></span>MacroMenu</button>
          <nav><button onClick={() => setView("home")}>Explore</button><button>Saved meals</button><button>Favorites</button></nav>
          <div className="header-actions">
            <button className="icon-button" onClick={() => setDark(!dark)} aria-label="Toggle dark mode">{dark ? <Sun size={17}/> : <Moon size={17}/>}</button>
            <button className="login"><UserRound size={16}/> Log in</button>
            <button className="signup">Get started</button>
          </div>
        </div>
      </header>

      {view === "home" ? (
        <>
          <section className="hero">
            <div className="shell hero-content">
              <div className="eyebrow"><Sparkles size={14}/> Made for eating out</div>
              <h1>Track restaurant<br/><em>macros in seconds.</em></h1>
              <p>Build meals from the places you love and instantly calculate calories, protein, carbs, and fat. No PDFs. No guesswork.</p>
              <div className="search-card">
                <div className="global-search">
                  <Search size={21}/>
                  <input value={search} onChange={event => setSearch(event.target.value)} onKeyDown={event => { if (event.key === "Enter") openFirstSearchResult(); }} placeholder="Search restaurants or foods" />
                  <span>Enter</span>
                  <button onClick={openFirstSearchResult}>Search</button>
                </div>
                {search && <div className="search-results">
                  {shownRestaurants.length > 0 && <p>Restaurants</p>}
                  {shownRestaurants.map(r => <button key={r.id} onClick={() => openRestaurant(r.id)}><Logo id={r.id} small/><span><b>{r.name}</b><small>{r.description}</small></span><ArrowRight size={16}/></button>)}
                  {shownItems.length > 0 && <p>Menu matches</p>}
                  {shownItems.map(item => {
                    const itemRestaurant = restaurants.find(r => r.id === item.restaurantId)!;
                    return <button key={item.id} onClick={() => openRestaurant(item.restaurantId)}><Logo id={item.restaurantId} small/><span><b>{item.name}</b><small>{itemRestaurant.name} · {item.calories} cal · {item.protein}g protein</small></span><ArrowRight size={16}/></button>;
                  })}
                  {shownRestaurants.length === 0 && shownItems.length === 0 && <div className="empty-search"><b>No exact match yet</b><small>Try a restaurant, food, or category like “coffee”, “beef”, or “Blizzard”.</small></div>}
                </div>}
                <div className="popular-search"><span>Try:</span>{featuredSearches.map(item => <button key={item} onClick={() => setSearch(item)}>{item}</button>)}</div>
              </div>
              <div className="hero-proof"><div><span>{menuItems.length}+</span><small>tracked rows</small></div><div><span>{restaurants.length}</span><small>restaurants</small></div><div><span>&lt; 10s</span><small>to build a meal</small></div></div>
            </div>
            <div className="hero-orb orb-one"/><div className="hero-orb orb-two"/>
          </section>

          <section className="shell popular section">
            <div className="section-heading"><div><p className="kicker">EXPLORE</p><h2>Popular restaurants</h2><span>Start building a meal from a fan favorite.</span></div><button>View all <ArrowRight size={16}/></button></div>
            <div className="collection-row">
              {homeCollections.map(collection => <div className="collection-card" key={collection.label}>
                <b>{collection.label}</b>
                <small>{collection.description}</small>
                <div>{collection.ids.map(id => <button key={id} onClick={() => openRestaurant(id)}><Logo id={id} small/></button>)}</div>
              </div>)}
            </div>
            <div className="restaurant-grid">
              {restaurants.map(r => <button className="restaurant-card" key={r.id} onClick={() => openRestaurant(r.id)}>
                <div className="restaurant-top"><Logo id={r.id}/><Heart size={17}/></div>
                <h3>{r.name}</h3><p>{r.description}</p>
                <div><span className="pill">{r.category}</span><ArrowRight size={17}/></div>
              </button>)}
            </div>
          </section>

          <section className="shell feature-banner">
            <div><div className="eyebrow"><Zap size={14}/> Fast and flexible</div><h2>Your macros. Your order.<br/><em>Your goals.</em></h2><p>Adjust serving sizes, account for heavy scoops, and save your go-to meals for next time.</p><button onClick={() => openRestaurant("panda")}>Build your first meal <ArrowRight size={17}/></button></div>
            <div className="mini-meal">
              <p>YOUR MEAL <span><Check size={13}/> Live totals</span></p>
              {[["Grilled Teriyaki Chicken","275 cal","33g protein"],["Super Greens","130 cal","9g protein"],["White Steamed Rice","520 cal","10g protein"]].map(item => <div key={item[0]}><span className="check"><Check size={14}/></span><b>{item[0]}</b><small>{item[1]} · {item[2]}</small></div>)}
              <footer><span><b>925</b><small>CALORIES</small></span><span><b>52g</b><small>PROTEIN</small></span><span><b>146g</b><small>CARBS</small></span><span><b>14g</b><small>FAT</small></span></footer>
            </div>
          </section>
        </>
      ) : (
        <>
          <section className="restaurant-hero">
            <div className="shell">
              <button className="back" onClick={() => setView("home")}><ChevronLeft size={16}/> All restaurants</button>
              <div className="restaurant-title"><Logo id={restaurant.id}/><div><div className="tag-row"><span>{restaurant.category}</span><span><Sparkles size={12}/> {officialBaselineRestaurants.has(restaurant.id) ? "Official baseline" : "Nutrition preview"}</span></div><h1>{restaurant.name}</h1><p>{restaurant.description} · Updated nutrition data</p></div><button className="favorite-rest"><Heart size={18}/> Favorite</button></div>
            </div>
          </section>
          <section className="shell builder-layout">
            <div className="catalog">
              <RestaurantBuilder restaurantId={restaurantId} meal={orderType} setMeal={setOrderType} selected={selected} addItem={addItem} removeItem={removeItem} updateQuantity={updateQuantity} jerseySize={jerseySize} setJerseySize={setJerseySize} subwaySize={subwaySize} setSubwaySize={setSubwaySize} starbucksSize={starbucksSize} setStarbucksSize={setStarbucksSize}/>
            </div>
            <MealPanel selected={selected} totals={totals} portion={portion} setPortion={setPortion} removeItem={removeItem} updateQuantity={updateQuantity} saved={saved} setSaved={setSaved} officialBaseline={officialBaselineRestaurants.has(restaurantId)}/>
          </section>
          <button className="mobile-meal-button" onClick={() => setDrawer(true)}><span><ShoppingBag size={18}/>{selected.length} items</span><b>{round(totals.calories)} cal</b><ChevronRight size={17}/></button>
          {drawer && <div className="drawer-backdrop" onClick={() => setDrawer(false)}><div className="drawer" onClick={e => e.stopPropagation()}><button className="drawer-close" onClick={() => setDrawer(false)}><X/></button><MealPanel selected={selected} totals={totals} portion={portion} setPortion={setPortion} removeItem={removeItem} updateQuantity={updateQuantity} saved={saved} setSaved={setSaved} officialBaseline={officialBaselineRestaurants.has(restaurantId)}/></div></div>}
        </>
      )}
    </main>
  );
}

const builderConfigs: Record<string, BuilderConfig> = {
  panda: { meals: [{name:"Bowl",description:"1 side + 1 entree"},{name:"Plate",description:"1 side + 2 entrees"},{name:"Bigger Plate",description:"1 side + 3 entrees"},{name:"A la Carte",description:"Build your own combo"}], groups: [{label:"Choose your entrees",help:"Mix favorites or make an entree double",categories:["Entrees"]},{label:"Choose your sides",help:"Pick rice, noodles, greens, or go half and half",categories:["Sides"]},{label:"Extras",help:"Add appetizers, drinks, and something sweet",categories:["Appetizers","Drinks","Desserts"]}], tip:"Use Light, Regular, or Double for every scoop, including half rice and half greens." },
  chipotle: { meals: [{name:"Bowl",description:"The classic build"},{name:"Burrito",description:"Includes flour tortilla",baseIds:["chip-tortilla"]},{name:"Salad",description:"Fresh greens base"},{name:"Tacos",description:"Includes 3 crispy shells",baseIds:["chip-taco-shells"]},{name:"Kid's Meal",description:"Quesadilla or build-your-own"}], groups: [{label:"Choose your protein",help:"Pick one, mix two, or go double, including limited-time proteins",categories:["Protein"],showWhen:["Bowl","Burrito","Salad","Tacos"]},{label:"Rice",help:"Make it light, regular, or double",categories:["Rice"],showWhen:["Bowl","Burrito","Salad","Tacos"]},{label:"Beans",help:"Add one or both",categories:["Beans"],showWhen:["Bowl","Burrito","Salad","Tacos"]},{label:"Toppings",help:"Finish it exactly how you order it",categories:["Toppings"],showWhen:["Bowl","Burrito","Salad","Tacos"]},{label:"Sides and extras",help:"Add protein cups, chips, or a tortilla on the side",categories:["Protein Cups","Sides"],variant:"extras",showWhen:["Bowl","Burrito","Salad","Tacos"]},{label:"Kids base",help:"Choose the kid-size taco tortillas, crispy shells, or quesadilla tortilla",categories:["Kids Base"],variant:"kids",showWhen:["Kid's Meal"]},{label:"Kids protein",help:"Kid-sized 2 oz meat or sofritas portions",categories:["Kids Proteins"],variant:"kids",showWhen:["Kid's Meal"]},{label:"Kids rice and beans",help:"Kid-sized rice and bean portions",categories:["Kids Rice & Beans"],variant:"kids",showWhen:["Kid's Meal"]},{label:"Kids toppings",help:"Kid-sized toppings like cheese, salsa, sour cream, guac, and lettuce",categories:["Kids Toppings"],variant:"kids",showWhen:["Kid's Meal"]},{label:"Kids fruit, chips, and drinks",help:"Add the kid side and drink options",categories:["Kids Fruit & Drinks","Kids Drinks"],variant:"kids",showWhen:["Kid's Meal"]}], tip:"Choose double steak, honey chicken, extra rice, protein cups, chips, tortillas, kids meals, and every topping individually." },
  chickfila: { meals: [{name:"Entree",description:"Sandwich, nuggets, or grilled protein"},{name:"Combo",description:"Entree + side + drink"},{name:"Sides & Treats",description:"Build a snack or lighter meal"}], groups: [{label:"Choose your entree",help:"Add one or combine items",categories:["Entrees"]},{label:"Choose your sides",help:"Fries, fruit, or both",categories:["Sides"]},{label:"Sauces",help:"Track every dipping sauce packet",categories:["Sauces"]},{label:"Drinks",help:"Finish your combo",categories:["Drinks"]}], tip:"Sauces count too. Add each packet and adjust the quantity if you use more than one." },
  potbelly: { meals: [{name:"Build your own sandwich",description:"Bread, meat, cheese, toppings"},{name:"Toasty favorite",description:"Start with a known sandwich"},{name:"Pick-your-pair",description:"Sandwich + side"}], groups: [{label:"Choose your bread",help:"Start with the bread style you actually ordered",categories:["Bread"]},{label:"Choose meats",help:"Add turkey, ham, roast beef, or double portions",categories:["Meats"]},{label:"Choose cheese",help:"Add or skip cheese",categories:["Cheese"]},{label:"Spreads and toppings",help:"Mayo, mustard, avocado, peppers, lettuce, tomato",categories:["Spreads","Toppings"]},{label:"Customize it",help:"Remove default ingredients or add extras",categories:["Remove Ingredients","Add Extras"]},{label:"Premade favorites and sides",help:"Optional shortcuts or add-ons",categories:["Sandwiches","Sides"]}], tip:"Potbelly is shown as preview data until its current official component feed is imported; the flow is ready for bread, meats, cheese, spreads, toppings, and removals." },
  jimmyjohns: { meals: [{name:"Build your own sandwich",description:"Bread, meats, cheese, freebies"},{name:"Original 8-inch",description:"Classic French bread order"},{name:"Unwich",description:"Lettuce-wrapped low-carb order"}], groups: [{label:"Choose your bread",help:"French, sliced wheat, or Unwich lettuce wrap",categories:["Bread"]},{label:"Choose meats",help:"Regular, light, or double meat portions",categories:["Meats"]},{label:"Choose cheese",help:"Add provolone or skip it",categories:["Cheese"]},{label:"Spreads",help:"Mayo, oil and vinegar, and other add-ons",categories:["Spreads"]},{label:"Toppings",help:"Freebies like peppers, tomato, and lettuce",categories:["Toppings"]},{label:"Customize it",help:"Remove default ingredients or add extras",categories:["Remove Ingredients","Add Extras"]},{label:"Premade favorites",help:"Optional shortcuts if you know the sandwich name",categories:["Sandwiches"]}], tip:"Jimmy John's component macros use its official add-on guide for 8-inch French, Unwich, sliced wheat, wraps, and customizations." },
  jerseymikes: { meals: [{name:"Build your own sub",description:"Bread, meats, cheese, Mike's Way"},{name:"Regular sub",description:"Classic regular-size sub"},{name:"Sub in a Tub",description:"No-bread bowl order"}], groups: [{label:"Choose your bread",help:"White, wheat, rosemary parmesan, or no-bread Sub in a Tub",categories:["Bread"]},{label:"Choose meats",help:"Add fresh-sliced meats, bacon, and double portions",categories:["Meats"]},{label:"Choose cheese",help:"Add provolone or skip it",categories:["Cheese"]},{label:"Spreads and Mike's Way",help:"Add mayo, oil, vinegar, lettuce, tomato, onion, or skip anything by not selecting it",categories:["Spreads","Toppings"]},{label:"Premade favorites",help:"Optional shortcuts while the official import is pending",categories:["Sandwiches"]}], tip:"Jersey Mike's is a true build-your-own flow: nothing is assumed, so users add bread, meat, cheese, spreads, and toppings only when they want them." },
  mcdonalds: { meals: [{name:"Combo meal",description:"Entree + fries + drink"},{name:"Burgers",description:"Big Mac, Quarter Pounder, cheeseburgers"},{name:"Chicken and nuggets",description:"McChicken, McCrispy, McNuggets, fish"},{name:"Breakfast",description:"Morning sandwiches and sides"},{name:"Drinks and sweets",description:"Fountain drinks, McCafe, desserts"}], groups: [{label:"Burgers",help:"Start with the burger or sandwich you actually ordered",categories:["Burgers"]},{label:"Chicken, fish, and nuggets",help:"McChicken, McCrispy, Filet-O-Fish, McNuggets, and other proteins",categories:["Chicken & Fish"]},{label:"Customize it",help:"Use removals like no mayo or no cheese, then add extras like bacon or extra cheese",categories:["Remove Ingredients","Add Extras"]},{label:"Breakfast",help:"Morning sandwiches, hash browns, and hotcakes",categories:["Breakfast"]},{label:"Sides",help:"Fries use size buttons; other sides track by item",categories:["Sides"]},{label:"Drinks",help:"Fountain drinks use size buttons where available",categories:["Drinks"]},{label:"McCafe",help:"Coffee drinks and shakes",categories:["McCafe"]},{label:"Sauces and desserts",help:"Track every sauce packet, cone, or pie",categories:["Sauces","Desserts"]}], tip:"McDonald's now supports customization rows too. Add the entree, then subtract removals like no mayo or no cheese, or add extras like bacon, cheese, and sauce." },
  culvers: { meals: [{name:"Value basket",description:"Entree + side + drink"},{name:"ButterBurger",description:"Single, double, deluxe, mushroom swiss"},{name:"Chicken and seafood",description:"Sandwiches, tenders, fish, shrimp"},{name:"Sides and salads",description:"Curds, fries, broccoli, soup, salads"},{name:"Custard run",description:"Scoops, mixers, shakes, sundaes"}], groups: [{label:"ButterBurgers",help:"Choose the burger base first, then add sides and drinks",categories:["Burgers"]},{label:"Chicken, fish, and baskets",help:"Track chicken sandwiches, tenders, cod, shrimp, and pot roast",categories:["Chicken & Fish"]},{label:"Customize it",help:"Remove mayo, cheese, bun, or add bacon and extra patties",categories:["Remove Ingredients","Add Extras"]},{label:"Sides",help:"Fries, curds, onion rings, broccoli, chili, and more",categories:["Sides"]},{label:"Salads and soup",help:"Lighter meals and add-ons",categories:["Salads & Soup"]},{label:"Frozen custard",help:"Scoops, mixers, sundaes, and shakes",categories:["Frozen Custard"]},{label:"Drinks and sauces",help:"Finish the value basket",categories:["Drinks","Sauces"]}], tip:"Culver's now follows the value-basket flow with entree, customization, side, drink, sauces, and custard." },
  starbucks: { meals: [{name:"Coffee",description:"Brewed, iced coffee, cold brew"},{name:"Espresso drink",description:"Latte, americano, mocha, macchiato"},{name:"Refresher",description:"Fruit refreshers and coconutmilk drinks"},{name:"Tea and matcha",description:"Tea lattes, chai, matcha, iced teas"},{name:"Frappuccino",description:"Blended coffee and creme drinks"},{name:"Food",description:"Breakfast and snacks"}], groups: [{label:"Coffee",help:"Brewed coffee, iced coffee, cold brew, and sweet cream cold brew",categories:["Coffee"]},{label:"Espresso",help:"Lattes, americanos, mochas, macchiatos, and flat whites",categories:["Espresso"]},{label:"Refreshers",help:"Strawberry Acai, Mango Dragonfruit, Pink Drink, and lemonade refreshers",categories:["Refreshers"]},{label:"Tea and matcha",help:"Chai, matcha, iced tea, and tea lemonades",categories:["Tea & Matcha"]},{label:"Frappuccino",help:"Coffee and creme blended beverages",categories:["Frappuccino"]},{label:"Customize it",help:"Track milk, syrup pumps, foam, shots, and removals like no whip",categories:["Customizations","Remove Ingredients","Add Extras"]},{label:"Food",help:"Breakfast sandwiches, egg bites, bakery, and protein boxes",categories:["Food"]}], tip:"Choose a drink size first, then pick from the Starbucks menu sections. Drink customizations, removals, and add-ons update totals." },
  tacobell: { meals: [{name:"Taco",description:"Shell + protein + toppings"},{name:"Burrito",description:"Tortilla + fillings + sauces"},{name:"Bowl or power menu",description:"Rice, beans, protein, toppings"},{name:"Crunchwrap or quesadilla",description:"Start with a folded favorite"},{name:"Combo",description:"Entrees + side + drink"}], groups: [{label:"Start with a base",help:"Choose the shell, tortilla, bowl, or known entree shortcut",categories:["Taco Bell Bases","Entrees"]},{label:"Protein and beans",help:"Add beef, chicken, steak, black beans, or refried beans",categories:["Proteins","Beans & Rice"]},{label:"Rice, potatoes, and cheese",help:"Build the filling the way you actually ordered it",categories:["Starches","Cheese"]},{label:"Toppings",help:"Lettuce, tomatoes, onions, guac, sour cream, and more",categories:["Toppings"]},{label:"Customize it",help:"Remove default sauces or add extras",categories:["Remove Ingredients","Add Extras"]},{label:"Sauces",help:"Creamy sauces, red sauce, nacho cheese, and sauce packets",categories:["Sauces"]},{label:"Sides, sweets, and drinks",help:"Add Nacho Fries, chips, twists, Cinnabon, and drinks",categories:["Sides","Desserts","Drinks"]}], tip:"Taco Bell now works like a custom builder: pick the shell or entree, add fillings, remove defaults, and add extras individually." },
  subway: { meals: [{name:"Build your own sub",description:"Size, bread, protein, toppings"},{name:"Protein bowl or salad",description:"Protein, cheese, veggies, sauce"},{name:"Named sandwiches",description:"Official 6-inch baselines"},{name:"Sides and sweets",description:"Cookies, brownies, chips"}], groups: [{label:"Choose bread",help:"Pick the 6-inch bread or flatbread first, then choose 6-inch or Footlong above",categories:["Bread"]},{label:"Choose protein",help:"Add turkey, ham, chicken, steak, tuna, meatballs, bacon, or double portions",categories:["Meats"]},{label:"Cheese",help:"Add cheese if your order includes it",categories:["Cheese"]},{label:"Veggies and toppings",help:"Veggies, avocado, olives, pickles, jalapenos, and more",categories:["Toppings"]},{label:"Sauces",help:"Track sauce portions separately",categories:["Sauces"]},{label:"Sandwich baselines",help:"Use these when you know the named Subway sandwich",categories:["Sandwiches"]},{label:"Desserts and sides",help:"Add cookies, brownies, chips, or sides",categories:["Desserts","Sides"]}], tip:"Subway now follows the Jersey Mike's style: pick size, bread, protein, cheese, veggies, and sauces. Named sandwiches are optional shortcuts." },
  fiveguys: { meals: [{name:"Build your own burger",description:"Bun, patties, cheese, toppings"},{name:"Fries",description:"Five Guys or Cajun style"},{name:"Shake",description:"Base plus mix-ins"},{name:"Hot dog or extras",description:"A la carte components"}], groups: [{label:"Start with bread",help:"Add the bun if your burger has one",categories:["Bread"]},{label:"Patties",help:"Add one or two hamburger patties",categories:["Patties"]},{label:"Cheese and bacon",help:"Add cheese slices or bacon",categories:["Cheese","Meats"]},{label:"Toppings",help:"Five Guys toppings are logged only when selected",categories:["Toppings"]},{label:"Sauces",help:"Mayo, BBQ, hot sauce, mustard, and more",categories:["Sauces"]},{label:"Fries",help:"Use exact Little, Regular, and Large fry macros",categories:["Sides"]},{label:"Shakes",help:"Start with a shake base, then add mix-ins",categories:["Shakes","Shake Mix-ins"]}], tip:"Five Guys is a perfect build-your-own restaurant: bun, patties, cheese, bacon, toppings, sauces, fries, and shake mix-ins are separate." },
  shakeshack: { meals: [{name:"Burgers",description:"Shack burgers and build components"},{name:"Chicken",description:"Chicken Shack or bites"},{name:"Fries",description:"Regular or cheese fries"},{name:"Shakes and drinks",description:"Shakes, lemonade, soda"}], groups: [{label:"Burgers",help:"Choose a Shack burger or build with components",categories:["Burgers"]},{label:"Burger components",help:"Roll, patty, cheese, bacon, and ShackSauce",categories:["Bread","Patties","Cheese","Meats","Sauces"]},{label:"Chicken",help:"Chicken sandwiches, bites, and sauces",categories:["Chicken"]},{label:"Sides",help:"Fries and cheese fries",categories:["Sides"]},{label:"Shakes",help:"Hand-spun shakes",categories:["Shakes"]},{label:"Drinks",help:"Soda and lemonade",categories:["Drinks"]}], tip:"Shake Shack has a clean nutrition PDF, so starter items include burgers, components, chicken, fries, shakes, and drinks." },
  dairyqueen: { meals: [{name:"Burgers and chicken",description:"Stackburgers, chicken, fish, hot dogs"},{name:"Sides",description:"Fries, curds, sauces"},{name:"Blizzards",description:"Treat size picker"},{name:"Shakes and drinks",description:"Shakes, smoothies, Julius"},{name:"Sundaes and desserts",description:"Cones, sundaes, cakes, drinks"}], groups: [{label:"Burgers",help:"Stackburger rows use official listed item macros",categories:["Burgers"]},{label:"Hot dogs",help:"Classic DQ hot dogs and chili cheese dogs",categories:["Hot Dogs"]},{label:"Chicken and fish",help:"Chicken strips, sandwiches, fish, and salads",categories:["Chicken","Salads"]},{label:"Sides",help:"Fries, cheese curds, and snack sides",categories:["Sides"]},{label:"Sauces",help:"Dips and sauces",categories:["Sauces"]},{label:"Blizzards",help:"Small, medium, and large Blizzard macros",categories:["Blizzards"]},{label:"Shakes and drinks",help:"Shake, MooLatte, slush, and drink macros",categories:["Shakes","Drinks"]},{label:"Sundaes and desserts",help:"Sundaes, cones, Dilly Bars, and other treats",categories:["Desserts"]}], tip:"Dairy Queen is organized by grill food, sides, treats, and drinks so users do not have to dig through one giant menu." },
  cava: { meals: [{name:"Build your own bowl",description:"Base, main, dips, toppings"},{name:"Curated bowl",description:"Official CAVA bowl recipes"},{name:"Pita",description:"Whole pita build"},{name:"Sides and desserts",description:"Chips, pita, brownie"}], groups: [{label:"Curated bowls",help:"Use official CAVA recipe macros when you order a named bowl",categories:["Curated Bowls"]},{label:"Bases",help:"Rice, lentils, greens, or whole pita",categories:["Bases"]},{label:"Mains",help:"Chicken, steak, falafel, lamb, salmon, or roasted vegetables",categories:["Mains"]},{label:"Dips and spreads",help:"Hummus, tzatziki, Crazy Feta, harissa, and more",categories:["Dips"]},{label:"Toppings",help:"Feta, cucumber, avocado, pita crisps, corn, and more",categories:["Toppings"]},{label:"Dressings",help:"Greek vinaigrette, tahini, skhug, and other dressings",categories:["Dressings"]},{label:"Sides and desserts",help:"Pita chips, pita, cookies, brownies, and drinks",categories:["Sides","Desserts","Drinks"]}], tip:"CAVA has one of the best official nutrition PDFs for MacroMenu: ingredient-by-ingredient bowl building with calories, protein, carbs, and fat." },
  portillos: { meals: [{name:"Hot dog",description:"Classic Chicago-style order"},{name:"Italian beef",description:"Beef, sausage, combo, croissant"},{name:"Burger",description:"Single or double burgers"},{name:"Chicken and fish",description:"Sandwiches, fish, tenders"},{name:"Salads and sides",description:"Fries, salads, sauces"},{name:"Shakes and dessert",description:"Cake, shakes, drinks"}], groups: [{label:"Hot dogs",help:"Classic hot dogs and sausage-style items",categories:["Hot Dogs"]},{label:"Italian beef and sausage",help:"Italian beef, big beef, Beef N Cheddar Croissant, sausage, bowls, and combos",categories:["Beef & Sausage"]},{label:"Burgers",help:"Burger rows use exact single and double macros where available",categories:["Burgers"]},{label:"Chicken and fish",help:"Chicken sandwiches, fish, and tenders",categories:["Chicken & Fish"]},{label:"Salads and sides",help:"Fries, onion rings, salads, soup, and sauces",categories:["Sides","Salads","Sauces"]},{label:"Shakes, desserts, and drinks",help:"Cake, shakes, chocolate cake shake, and fountain drinks",categories:["Shakes","Desserts","Drinks"]},{label:"Add-ons",help:"Cheese, peppers, gravy, and other tracked extras",categories:["Add Ons"]}], tip:"Portillo's is now split into the sections people actually order from: hot dogs, beef/sausage, burgers, chicken/fish, sides, and dessert drinks." },
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
  if (!meal) return <div className="chipotle-start">
    <div className="catalog-head"><div><span className="step-label">STEP 1 OF 2</span><h2>What are you building?</h2><p>Choose a meal type, then make it match your actual {restaurant.name} order.</p></div></div>
    <div className="meal-type-grid">
      {config.meals.map(choice => <button onClick={() => chooseMeal(choice)} key={choice.name}>
        <span><Utensils size={21}/></span><b>{choice.name}</b><small>{choice.description}</small><ArrowRight size={17}/>
      </button>)}
    </div>
    <div className="chipotle-note"><Sparkles size={15}/><span><b>Built for real orders.</b> {config.tip}</span></div>
  </div>;
  return <div className="chipotle-builder">
    <div className="catalog-head chipotle-builder-head"><div><span className="step-label">STEP 2 OF 2</span><h2>{meal.toLowerCase().includes("build") ? meal : `Build your ${meal.toLowerCase()}`}</h2><p>Tap an item, then choose a portion. Customize it the way you really order it.</p></div><button onClick={() => setMeal(null)}><ChevronLeft size={15}/> Change meal</button></div>
    <div className="chipotle-base"><span><Check size={15}/></span><div><b>{meal}</b><small>{restaurant.name} custom order</small></div></div>
    {restaurantId === "jerseymikes" && <div className="size-selector"><div><b>Choose sandwich size</b><small>Macros scale from the regular-size baseline.</small></div><div>{jerseyMikesSizes.map(size => <button className={jerseySize === size.label ? "active" : ""} onClick={() => setJerseySize(size.label)} key={size.label}><b>{size.label}</b><small>{size.description}</small></button>)}</div></div>}
    {restaurantId === "subway" && <div className="size-selector"><div><b>Choose sandwich size</b><small>Footlong doubles bread, proteins, cheese, toppings, and sauces from the 6-inch baseline.</small></div><div>{subwaySizes.map(size => <button className={subwaySize === size.label ? "active" : ""} onClick={() => setSubwaySize(size.label)} key={size.label}><b>{size.label}</b><small>{size.description}</small></button>)}</div></div>}
    {restaurantId === "starbucks" && <div className="size-selector"><div><b>Choose drink size</b><small>Applies to coffee, espresso, refreshers, tea, frappes, and customizations.</small></div><div>{starbucksSizes.map(size => <button className={starbucksSize === size.label ? "active" : ""} onClick={() => setStarbucksSize(size.label)} key={size.label}><b>{size.label}</b><small>{size.description}</small></button>)}</div></div>}
    <div className={restaurantId === "chipotle" && meal !== "Kid's Meal" ? "chipotle-columns" : ""}>
      <div>
    {visibleGroups.filter(group => group.variant !== "extras").map(group => <section className={`ingredient-group ${group.variant === "kids" ? "kids-group" : ""}`} key={group.label}>
      <header><div><h3>{group.label}</h3><p>{group.help}</p></div></header>
      <div>{menuItems.filter(item => item.restaurantId === restaurantId && group.categories.includes(item.category)).map(item => {
        const quantity = selected.find(row => row.item.id === item.id)?.quantity ?? 0;
        return <article className={quantity ? "ingredient-row selected" : "ingredient-row"} key={item.id}>
          <button className="ingredient-main" onClick={() => quantity ? removeItem(item.id) : addItem(item)}>
            <span className="ingredient-check">{quantity ? <Check size={14}/> : <Plus size={14}/>}</span>
            <span><b>{item.name}</b><small>{item.description}</small></span>
          </button>
          <MacroStats macro={item}/>
          <ItemControls item={item} quantity={quantity} removeItem={removeItem} updateQuantity={updateQuantity}/>
        </article>;
      })}</div>
    </section>)}
      </div>
      {restaurantId === "chipotle" && meal !== "Kid's Meal" && <aside className="extras-column">{visibleGroups.filter(group => group.variant === "extras").map(group => <section className="ingredient-group extras-group" key={group.label}>
        <header><div><h3>{group.label}</h3><p>{group.help}</p></div></header>
        <div>{menuItems.filter(item => item.restaurantId === restaurantId && group.categories.includes(item.category)).map(item => {
          const quantity = selected.find(row => row.item.id === item.id)?.quantity ?? 0;
          return <article className={quantity ? "ingredient-row selected" : "ingredient-row"} key={item.id}>
            <button className="ingredient-main" onClick={() => quantity ? removeItem(item.id) : addItem(item)}>
              <span className="ingredient-check">{quantity ? <Check size={14}/> : <Plus size={14}/>}</span>
              <span><b>{item.name}</b><small>{item.description}</small></span>
            </button>
            <MacroStats macro={item}/>
            <ItemControls item={item} quantity={quantity} removeItem={removeItem} updateQuantity={updateQuantity}/>
          </article>;
        })}</div>
      </section>)}</aside>}
    </div>
  </div>;
}

function ItemControls({ item, quantity, removeItem, updateQuantity }: {
  item: MenuItem; quantity: number; removeItem: (id: string) => void; updateQuantity: (id: string, quantity: number) => void;
}) {
  if (item.control === "toggle") return <div className="scoop-control toggle-control">
    <button className={quantity === 0 ? "active" : ""} onClick={() => removeItem(item.id)}>No</button>
    <button className={quantity === 1 ? "active" : ""} onClick={() => updateQuantity(item.id, 1)}>Apply</button>
  </div>;

  if (item.control === "size") return <div className="scoop-control size-control">
    <button className={quantity === 0 ? "active" : ""} onClick={() => removeItem(item.id)}>None</button>
    {itemSizeOptions.map(size => <button className={quantity === size.value ? "active" : ""} onClick={() => updateQuantity(item.id, size.value)} key={size.label}>{size.label}</button>)}
  </div>;

  if (item.control === "quantity" || quantityCategories.includes(item.category)) return <div className="scoop-control quantity-control">
    <button className={quantity === 0 ? "active" : ""} onClick={() => removeItem(item.id)}>None</button>
    {[1, 2, 3].map(value => <button className={quantity === value ? "active" : ""} onClick={() => updateQuantity(item.id, value)} key={value}>{value === 1 ? "1 item" : `${value} items`}</button>)}
  </div>;

  return <div className="scoop-control">
    {[0, .5, 1, 2].map(value => <button className={quantity === value ? "active" : ""} onClick={() => value === 0 ? removeItem(item.id) : updateQuantity(item.id, value)} key={value}>{value === 0 ? "None" : value === .5 ? "Light" : value === 1 ? "Regular" : "Double"}</button>)}
  </div>;
}

function MealPanel({ selected, totals, portion, setPortion, removeItem, updateQuantity, saved, setSaved, officialBaseline }: {
  selected: Selected[]; totals: Macro; portion: keyof typeof portionMultipliers;
  setPortion: (value: keyof typeof portionMultipliers) => void; removeItem: (id: string) => void;
  updateQuantity: (id: string, value: number) => void; saved: boolean; setSaved: (value: boolean) => void; officialBaseline: boolean;
}) {
  return <aside className="meal-panel">
    <div className="meal-heading"><div><span>YOUR MEAL</span><h2>Meal builder</h2></div><button onClick={() => selected.forEach(row => removeItem(row.item.id))}>Clear</button></div>
    <div className="portion-box"><div><span>Portion estimate</span><small>Adjust for restaurant portions</small></div><div>{Object.keys(portionMultipliers).map(item => <button className={portion === item ? "active" : ""} onClick={() => setPortion(item as keyof typeof portionMultipliers)} key={item}>{item}</button>)}</div></div>
    <div className="meal-items">
      {!selected.length && <div className="empty-meal"><ShoppingBag size={25}/><b>Your meal is empty</b><span>Add menu items to start tracking.</span></div>}
      {selected.map(({ item, quantity }) => {
        const rowMacro = macroForSelection(item, quantity);
        const sizeLabel = item.control === "size" ? item.sizeMacros?.find(size => size.value === quantity)?.label : null;
        return <div className="meal-row" key={item.id}><span className="meal-row-icon"><Check size={13}/></span><div><b>{item.name}</b><small>{round(rowMacro.calories)} cal · {round(rowMacro.protein)}g protein</small><div className="qty">{item.control === "toggle" || item.control === "size" ? <span>{sizeLabel ?? "applied"}</span> : <><button onClick={() => updateQuantity(item.id, quantity - .5)}>−</button><span>{quantity}x</span><button onClick={() => updateQuantity(item.id, quantity + .5)}>+</button></>}</div></div><button onClick={() => removeItem(item.id)}><Trash2 size={15}/></button></div>;
      })}
    </div>
    <div className="totals"><div className="total-cal"><span>TOTAL CALORIES</span><b>{round(totals.calories)}</b></div><div className="total-macros"><span><b>{round(totals.protein)}g</b><small>PROTEIN</small></span><span><b>{round(totals.carbs)}g</b><small>CARBS</small></span><span><b>{round(totals.fat)}g</b><small>FAT</small></span></div></div>
    <button className={saved ? "save-meal saved" : "save-meal"} onClick={() => setSaved(!saved)}>{saved ? <Check size={17}/> : <Bookmark size={17}/>} {saved ? "Meal saved" : "Save this meal"}</button>
    <p className="meal-note"><Sparkles size={13}/> {officialBaseline ? "Baseline macros use published restaurant nutrition data. Portion adjustments are estimates." : "Nutrition preview data is being audited against official restaurant sources."}</p>
  </aside>
}
