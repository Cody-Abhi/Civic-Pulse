import time
import os
from playwright.sync_api import sync_playwright

output_dir = "ppt/product/screenshots"
os.makedirs(output_dir, exist_ok=True)

def capture():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        
        # 1. Desktop context 1440x900
        context_desktop = browser.new_context(
            viewport={"width": 1440, "height": 900},
            device_scale_factor=2
        )
        page = context_desktop.new_page()

        print("1. Landing page desktop...")
        page.goto("https://civicpulse.vercel.app", wait_until="domcontentloaded", timeout=30000)
        time.sleep(4)
        page.screenshot(path=os.path.join(output_dir, "01_landing_hero.png"))

        print("2. Explore map...")
        page.goto("https://civicpulse.vercel.app/explore/map", wait_until="domcontentloaded", timeout=30000)
        time.sleep(5)
        page.screenshot(path=os.path.join(output_dir, "02_explore_map.png"))

        print("3. Login page with demo roles...")
        page.goto("https://civicpulse.vercel.app/login", wait_until="domcontentloaded", timeout=30000)
        time.sleep(3)
        page.screenshot(path=os.path.join(output_dir, "03_login_page.png"))

        print("4. Logging in as Roads Authority...")
        try:
            btn = page.locator('button:has-text("Roads Authority Demo")')
            if btn.count() > 0:
                btn.first.click()
                time.sleep(6)
                print("Authority Queue URL:", page.url)
                page.screenshot(path=os.path.join(output_dir, "04_authority_queue.png"))
                
                # Navigate to first complaint workspace if available
                rows = page.locator('tr, a[href*="/authority/complaints/"]')
                if rows.count() > 0:
                    first_link = page.locator('a[href*="/authority/complaints/"]').first
                    if first_link.count() > 0:
                        first_link.click()
                        time.sleep(4)
                        print("Authority Workspace URL:", page.url)
                        page.screenshot(path=os.path.join(output_dir, "05_authority_workspace.png"))
        except Exception as e:
            print("Authority capture error:", e)

        print("5. Logging in as Citizen Demo...")
        page_citizen = context_desktop.new_page()
        page_citizen.goto("https://civicpulse.vercel.app/login", wait_until="domcontentloaded", timeout=30000)
        time.sleep(3)
        try:
            c_btn = page_citizen.locator('button:has-text("Citizen Demo")')
            if c_btn.count() > 0:
                c_btn.first.click()
                time.sleep(6)
                print("Citizen URL:", page_citizen.url)
                page_citizen.screenshot(path=os.path.join(output_dir, "06_citizen_dashboard.png"))

                # Go to new complaint wizard
                page_citizen.goto("https://civicpulse.vercel.app/citizen/complaints/new", wait_until="domcontentloaded", timeout=30000)
                time.sleep(4)
                page_citizen.screenshot(path=os.path.join(output_dir, "07_citizen_wizard_step1.png"))
        except Exception as e:
            print("Citizen capture error:", e)

        # 6. Mobile context 390x844
        print("6. Mobile citizen report wizard...")
        context_mobile = browser.new_context(
            viewport={"width": 390, "height": 844},
            device_scale_factor=2,
            is_mobile=True
        )
        page_mobile = context_mobile.new_page()
        page_mobile.goto("https://civicpulse.vercel.app/login", wait_until="domcontentloaded", timeout=30000)
        time.sleep(3)
        try:
            m_btn = page_mobile.locator('button:has-text("Citizen Demo")')
            if m_btn.count() > 0:
                m_btn.first.click()
                time.sleep(6)
                page_mobile.goto("https://civicpulse.vercel.app/citizen/complaints/new", wait_until="domcontentloaded", timeout=30000)
                time.sleep(4)
                page_mobile.screenshot(path=os.path.join(output_dir, "08_mobile_wizard.png"))
        except Exception as e:
            print("Mobile capture error:", e)

        browser.close()
        print("Screenshot capture complete!")

if __name__ == "__main__":
    capture()

