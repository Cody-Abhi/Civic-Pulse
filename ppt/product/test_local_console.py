from playwright.sync_api import sync_playwright
import time

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page = browser.new_page(viewport={"width": 1440, "height": 900})
    page.on("console", lambda msg: print(f"BROWSER CONSOLE: {msg.text}"))
    page.goto("http://localhost:3000/login")
    time.sleep(2)
    
    btn = page.locator('button:has-text("Citizen Demo")')
    if btn.count() > 0:
        btn.first.click()
        time.sleep(4)
        print("Alerts:", page.locator('[role="alert"]').all_inner_texts())
    browser.close()

