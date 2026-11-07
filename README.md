# Ryan's Recipes

Recipes from my kitchen, published with GitHub Pages.

## Put the site online (one time)

1. Sign in at github.com and click **New repository**. Name it `recipes`, set it to **Public**, and click **Create repository**.
2. On the new repository page, click **uploading an existing file**. Drag in everything from this folder (the files *and* the `_layouts`, `_data`, `assets` and `recipes` folders), then click **Commit changes**.
3. Go to **Settings → Pages**. Under "Build and deployment", set Source to **Deploy from a branch**, pick **main** and **/ (root)**, and click **Save**.
4. Wait a minute or two, then refresh that page. The address of your site appears at the top, something like `https://yourname.github.io/recipes/`.

## Add a recipe

1. In the repository, open the `recipes` folder and click **Add file → Create new file**.
2. Name it after the recipe, all lowercase with dashes and ending in `.md`, for example `brown-butter-pecan.md`.
3. Copy everything from `RECIPE-TEMPLATE.md`, paste it in, and fill it in.
4. Click **Commit changes**. The recipe shows up on the site in about a minute.

To change a recipe, open its file and click the pencil icon. To remove one, open it, click the **…** menu and choose **Delete file**.

## Rules for the recipe file

- Keep the three dashes `---` at the top and after `tags`.
- `category` must be one of: `ice-cream`, `breakfast`, `mains`, `sides`, `soups`, `baking`, `desserts`, `drinks`, `other`.
- The time and size lines (`serves`, `makes`, `prep`, `cook`, `churn`, `chill`, `freeze`, `total`) are all optional. Delete the ones that don't apply.
- If a line at the top needs a colon in it, put the whole value in quotes: `description: "Grandma's rule: never skip the salt"`.
- Start each ingredient with its amount (`2`, `3/4`, `1 1/2`, `1½`) so the ½× / 2× / 3× buttons can scale it.
- A line ending in a colon, like `For the frosting:`, becomes a heading inside the ingredient list.

## Categories

Categories are listed in `_data/categories.yml`. To add one (say, "Grilling"), copy one of the blocks there and give it a new key, name and color. A category only shows up as a filter button once it has at least one recipe.

You can link straight to a category by adding its key to the address: `https://yourname.github.io/recipes/#ice-cream`.

## Let family add recipes

Go to **Settings → Collaborators → Add people** and invite them by GitHub username or email. They'll need a free GitHub account.
