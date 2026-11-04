from playwright.sync_api import sync_playwright
import time

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page = browser.new_page(viewport={"width": 1440, "height": 900})
    page.goto("https://civicpulse.vercel.app/login")
    time.sleep(2)
    page.fill('input[type="email"]', "roads@demo.civicpulse.invalid")
    page.fill('input[type="password"]', "CivicPulseDemo2026!")
    page.click('button[type="submit"]')
    time.sleep(5)
    alerts = page.locator('[role="alert"]').all_inner_texts()
    print("Alerts:", alerts)
    browser.close()
