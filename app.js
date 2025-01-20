// app.js
const express = require("express");
const { Builder, By, Key, until } = require("selenium-webdriver");
const chrome = require("selenium-webdriver/chrome");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;

// -- 1) Create driver once on startup --
const options = new chrome.Options()
  .addArguments("--headless")
  .addArguments("--no-sandbox")
  .addArguments("--disable-dev-shm-usage")
  .addArguments("--blink-settings=imagesEnabled=false") // Turn off images
  .addArguments("--disable-gpu"); // If GPU issues

// Global driver (only 1 instance)
let driver;
(async () => {
  driver = await new Builder()
    .forBrowser("chrome")
    .setChromeOptions(options)
    .build();
})();

// -- 2) Serve static files --
app.use(express.static(path.join(__dirname, "public")));

// -- 3) Route using the global driver --
app.get("/search", async (req, res) => {
  // Simple "mutex" to prevent concurrency overlap (optional)
  if (!driver) {
    return res.status(503).json({ error: "Driver not initialized yet." });
  }

  let rawInput = req.query.course || "CSCI 0190";
  let noSpaces = rawInput.replace(/\s+/g, "");
  let course = noSpaces.slice(0, 4).toUpperCase() + " " + noSpaces.slice(4);

  let freeSections = {};
  let courseFound = false;

  // A basic concurrency lock to avoid multiple parallel navigations
  global.locked = global.locked || false;
  while (global.locked) {
    // Wait a tiny bit until it's free
    await new Promise((r) => setTimeout(r, 200));
  }
  global.locked = true;

  try {
    // Instead of building driver, just reuse
    await driver.get("https://cab.brown.edu/");

    const searchInput = await driver.findElement(
      By.xpath('//input[@class="form-control"]')
    );
    await searchInput.sendKeys(course.slice(0, 4), Key.RETURN);

    const xpathResults =
      '//div[@class="panel panel--kind-results panel--visible"]' +
      '//div[@class="panel__body"]//div[@class="result result--group-start"]';

    // Adjust or increase timeouts if needed
    await driver.wait(until.elementLocated(By.xpath(xpathResults)), 3000);

    const courses = await driver.findElements(By.xpath(xpathResults));
    for (let c of courses) {
      const code = await c
        .findElement(
          By.xpath(
            './/a//span[@class="result__headline"]//span[@class="result__code"]'
          )
        )
        .getText();

      if (code === course) {
        courseFound = true;
        await c.click();

        // Wait for matched sections
        const sectionLocator = By.xpath(
          '//a[@class="course-section course-section--matched"]'
        );
        await driver.wait(until.elementLocated(sectionLocator), 3000);
        const matchedSections = await driver.findElements(sectionLocator);

        for (let section of matchedSections) {
          try {
            await section.findElement(
              By.xpath('.//i[@class="fa fa-fw icon--warn"]')
            );
            // If found, it's not free => skip
          } catch {
            // If not found, we treat it as free
            const sectionCode = await section
              .findElement(By.xpath('.//div[@class="course-section-section"]'))
              .getText();
            const meets = await section
              .findElement(
                By.xpath('.//div[@class="course-section-all-sections-meets"]')
              )
              .getText();
            freeSections[sectionCode.slice(-3)] = meets.replace("Meets:\n", "");
          }
        }
        break;
      }
    }

    if (!courseFound) {
      return res.status(404).json({
        error: `Course "${course}" not found or no free sections available.`,
      });
    }
    res.json({ course, freeSections });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "An error occurred while scraping." });
  } finally {
    // Instead of quitting, we keep the driver running
    // Clear the lock
    global.locked = false;
  }
});

// -- 4) Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
