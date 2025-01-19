const express = require('express');
const { Builder, By, Key, until } = require('selenium-webdriver');
const chrome = require('selenium-webdriver/chrome');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Serve static files from the "public" directory
app.use(express.static(path.join(__dirname, 'public')));

// Route: /search?course=CSCI0100
app.get('/search', async (req, res) => {
  const course = req.query.course || 'CSCI0100';

  // Configure headless Chrome
  const options = new chrome.Options()
    .addArguments('--headless')
    .addArguments('--no-sandbox')
    .addArguments('--disable-dev-shm-usage');

  const driver = await new Builder()
    .forBrowser('chrome')
    .setChromeOptions(options)
    .build();

  const freeSections = {};
  let courseFound = false;

  try {
    await driver.get('https://cab.brown.edu/');

    const searchInput = await driver.findElement(By.xpath('//input[@class="form-control"]'));
    await searchInput.sendKeys(course.slice(0, 4));
    await searchInput.sendKeys(Key.RETURN);

    const xpathResults = '//div[@class="panel panel--kind-results panel--visible"]//div[@class="result result--group-start"]';
    await driver.wait(until.elementLocated(By.xpath(xpathResults)), 10000);

    const courses = await driver.findElements(By.xpath(xpathResults));

    for (let courseElement of courses) {
      const courseCode = await courseElement
        .findElement(By.xpath('.//a//span[@class="result__headline"]//span[@class="result__code"]'))
        .getText();

      if (courseCode === course) {
        courseFound = true;

        await courseElement.click();
        const sections = await driver.findElements(By.xpath('//a[@class="course-section course-section--matched"]'));

        for (let section of sections) {
          try {
            await section.findElement(By.xpath('.//i[@class="fa fa-fw icon--warn"]'));
          } catch {
            const sectionCode = await section.findElement(By.xpath('.//div[@class="course-section-section"]')).getText();
            const timeInfo = await section.findElement(By.xpath('.//div[@class="course-section-all-sections-meets"]')).getText();
            freeSections[sectionCode.slice(-3)] = timeInfo.replace('Meets:\n', '');
          }
        }
        break;
      }
    }

    if (!courseFound) {
      res.status(404).json({ error: `Course "${course}" not found or no free sections available.` });
    } else {
      res.json({ course, freeSections });
    }

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'An error occurred while scraping.' });
  } finally {
    await driver.quit();
  }
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
