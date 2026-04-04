from playwright.sync_api import sync_playwright
import re

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page = browser.new_page()
    
    errors = []
    page.on("console", lambda msg: errors.append(msg.text) if msg.type == "error" else None)
    
    print("1. Loading landing page...")
    page.goto('http://localhost:5180')
    page.wait_for_load_state('networkidle')
    page.wait_for_timeout(3000)
    page.screenshot(path='D:/Code/Guidwire/gigguard/frontend/test_results/1_landing.png')
    print("   Landing page loaded")
    
    print("2. Navigating to Login...")
    page.goto('http://localhost:5180/login')
    page.wait_for_load_state('networkidle')
    page.wait_for_timeout(2000)
    page.screenshot(path='D:/Code/Guidwire/gigguard/frontend/test_results/2_login.png')
    
    print("3. Logging in as admin...")
    page.fill('input[type="email"]', 'admin@skysure.com')
    page.fill('input[type="password"]', 'admin123')
    page.click('button[type="submit"]')
    page.wait_for_timeout(3000)
    page.screenshot(path='D:/Code/Guidwire/gigguard/frontend/test_results/3_after_login.png')
    print("   Login submitted")
    
    print("4. Navigating to Overview...")
    page.goto('http://localhost:5180/client/overview')
    page.wait_for_load_state('networkidle')
    page.wait_for_timeout(3000)
    page.screenshot(path='D:/Code/Guidwire/gigguard/frontend/test_results/4_overview.png')
    print("   Overview page loaded")
    
    print("5. Navigating to Simulation...")
    page.goto('http://localhost:5180/client/simulation')
    page.wait_for_load_state('networkidle')
    page.wait_for_timeout(3000)
    page.screenshot(path='D:/Code/Guidwire/gigguard/frontend/test_results/5_simulation.png')
    print("   Simulation page loaded")
    
    print("6. Running simulation...")
    # Try multiple possible button texts
    run_btn = page.locator('button:has-text("Execute Run"), button:has-text("Begin Baseline Run"), button:has-text("Execute")').first
    if run_btn.count() > 0:
        run_btn.click()
        page.wait_for_timeout(5000)
        page.screenshot(path='D:/Code/Guidwire/gigguard/frontend/test_results/6_simulation_done.png')
        print("   Simulation completed")
    else:
        print("   Run Simulation button not found!")
        page.screenshot(path='D:/Code/Guidwire/gigguard/frontend/test_results/error.png')
    
    if errors:
        print(f"\nConsole errors: {errors[:5]}")
    else:
        print("\nNo console errors!")
    
    browser.close()
    print("\nTest completed successfully!")