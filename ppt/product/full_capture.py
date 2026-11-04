import os
import time
from playwright.sync_api import sync_playwright

output_dir = "ppt/product/screenshots"
os.makedirs(output_dir, exist_ok=True)

def run_capture():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        
        # 1. Desktop 1440x900
        context = browser.new_context(
            viewport={"width": 1440, "height": 900},
            device_scale_factor=2
        )
        page = context.new_page()

        # Landing Hero
        print("Capturing 01_landing_hero...")
        page.goto("http://localhost:3000", wait_until="domcontentloaded")
        time.sleep(3)
        page.screenshot(path=os.path.join(output_dir, "01_landing_hero.png"))

        # Explore Map
        print("Capturing 02_explore_map...")
        page.goto("http://localhost:3000/explore/map", wait_until="domcontentloaded")
        time.sleep(5)
        page.screenshot(path=os.path.join(output_dir, "02_explore_map.png"))

        # Login Page
        print("Capturing 03_login_page...")
        page.goto("http://localhost:3000/login", wait_until="domcontentloaded")
        time.sleep(2)
        page.screenshot(path=os.path.join(output_dir, "03_login_page.png"))

        # Roads Authority Demo Login
        print("Logging in as Roads Authority...")
        auth_btn = page.locator('button:has-text("Roads Authority Demo")')
        if auth_btn.count() > 0:
            auth_btn.first.click()
            time.sleep(4)
            
        print("Capturing 04_authority_queue...")
        page.goto("http://localhost:3000/authority/queue", wait_until="domcontentloaded")
        time.sleep(4)
        page.screenshot(path=os.path.join(output_dir, "04_authority_queue.png"))

        # Authority first complaint workspace
        print("Capturing 05_authority_workspace...")
        links = page.locator('a[href^="/authority/complaints/"]')
        if links.count() > 0:
            first_url = links.first.get_attribute("href")
            if first_url:
                page.goto(f"http://localhost:3000{first_url}", wait_until="domcontentloaded")
                time.sleep(4)
                page.screenshot(path=os.path.join(output_dir, "05_authority_workspace.png"))

        # Authority Map
        print("Capturing 06_authority_map...")
        page.goto("http://localhost:3000/authority/map", wait_until="domcontentloaded")
        time.sleep(4)
        page.screenshot(path=os.path.join(output_dir, "06_authority_map.png"))

        # Citizen Login & Wizard
        print("Logging in as Citizen Demo...")
        page_citizen = browser.new_page(
            viewport={"width": 1440, "height": 900},
            device_scale_factor=2
        )
        page_citizen.goto("http://localhost:3000/login", wait_until="domcontentloaded")
        time.sleep(2)
        c_btn = page_citizen.locator('button:has-text("Citizen Demo")')
        if c_btn.count() > 0:
            c_btn.first.click()
            time.sleep(4)

        print("Capturing 07_citizen_dashboard...")
        page_citizen.goto("http://localhost:3000/citizen/dashboard", wait_until="domcontentloaded")
        time.sleep(3)
        page_citizen.screenshot(path=os.path.join(output_dir, "07_citizen_dashboard.png"))

        print("Capturing 08_citizen_wizard...")
        page_citizen.goto("http://localhost:3000/citizen/complaints/new", wait_until="domcontentloaded")
        time.sleep(3)
        page_citizen.screenshot(path=os.path.join(output_dir, "08_citizen_wizard_desktop.png"))

        # Citizen detail with Priority Receipt
        print("Capturing 09_citizen_priority_receipt...")
        c_links = page_citizen.locator('a[href^="/citizen/complaints/"]')
        page_citizen.goto("http://localhost:3000/citizen/complaints", wait_until="domcontentloaded")
        time.sleep(3)
        c_links = page_citizen.locator('a[href^="/citizen/complaints/"]')
        if c_links.count() > 0:
            c_url = c_links.first.get_attribute("href")
            if c_url and c_url != "/citizen/complaints/new":
                page_citizen.goto(f"http://localhost:3000{c_url}", wait_until="domcontentloaded")
                time.sleep(4)
                page_citizen.screenshot(path=os.path.join(output_dir, "09_citizen_priority_receipt.png"))

        # Mobile Citizen Wizard 390x844
        print("Capturing 10_mobile_wizard...")
        context_mobile = browser.new_context(
            viewport={"width": 390, "height": 844},
            device_scale_factor=2,
            is_mobile=True
        )
        page_mobile = context_mobile.new_page()
        page_mobile.goto("http://localhost:3000/login", wait_until="domcontentloaded")
        time.sleep(2)
        m_btn = page_mobile.locator('button:has-text("Citizen Demo")')
        if m_btn.count() > 0:
            m_btn.first.click()
            time.sleep(3)
        page_mobile.goto("http://localhost:3000/citizen/complaints/new", wait_until="domcontentloaded")
        time.sleep(3)
        page_mobile.screenshot(path=os.path.join(output_dir, "10_mobile_citizen_wizard.png"))

        browser.close()
        print("All screenshots successfully captured!")

if __name__ == "__main__":
    run_capture()

