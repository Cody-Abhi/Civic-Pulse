from playwright.sync_api import sync_playwright
import time

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page = browser.new_page(viewport={"width": 1440, "height": 900})
    page.goto("http://localhost:3000/login")
    time.sleep(2)
    
    btn = page.locator('button:has-text("Citizen Demo")')
    if btn.count() > 0:
        btn.first.click()
        time.sleep(4)
        print("Citizen Current URL:", page.url)
        page.screenshot(path="ppt/product/screenshots/local_citizen_dashboard.png")
        
        # Now visit new complaint wizard
        page.goto("http://localhost:3000/citizen/complaints/new")
        time.sleep(3)
        print("Wizard URL:", page.url)
        page.screenshot(path="ppt/product/screenshots/local_citizen_wizard.png")
    browser.close()

