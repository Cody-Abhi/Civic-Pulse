from playwright.sync_api import sync_playwright
import time

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page = browser.new_page(viewport={"width": 1440, "height": 900})
    page.goto("http://localhost:3000/login")
    time.sleep(2)
    print("Page title:", page.title())
    
    # Try clicking the Citizen Demo button
    btn = page.locator('button:has-text("Citizen Demo")')
    if btn.count() > 0:
        print("Found Citizen Demo button, clicking...")
        btn.first.click()
        time.sleep(4)
        print("URL after Citizen Demo click:", page.url)
        page.screenshot(path="ppt/product/screenshots/local_citizen_dashboard.png")
    else:
        print("Citizen Demo button not found")

    browser.close()

