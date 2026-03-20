from playwright.sync_api import sync_playwright
import re

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page = browser.new_page()
    
    errors = []
    page.on("console", lambda msg: errors.append(msg.text) if msg.type == "error" else None)
    
    print("1. Loading landing page...")
    page.goto('http://localhost:5174')
    page.wait_for_load_state('networkidle')
    page.screenshot(path='D:/Code/Guidwire/gigguard/frontend/test_results/1_landing.png')
    print("   Landing page loaded")
    
    print("2. Clicking Company Dashboard...")
    page.click('text=Company Dashboard')
    page.wait_for_load_state('networkidle')
    page.wait_for_timeout(2000)
    page.screenshot(path='D:/Code/Guidwire/gigguard/frontend/test_results/2_overview.png')
    print("   Overview page loaded")
    
    print("3. Navigating to Simulation...")
    page.click('a:has-text("Simulation")')
    page.wait_for_load_state('networkidle')
    page.wait_for_timeout(3000)
    page.screenshot(path='D:/Code/Guidwire/gigguard/frontend/test_results/3_simulation_before.png')
    print("   Simulation page loaded")
    
    print("4. Running simulation...")
    run_btn = page.locator('button').filter(has_text="Run Simulation")
    if run_btn.count() > 0:
        run_btn.click()
        page.wait_for_load_state('networkidle')
        page.wait_for_timeout(3000)
        page.screenshot(path='D:/Code/Guidwire/gigguard/frontend/test_results/4_simulation_after.png')
        print("   Simulation completed")
        
        print("5. Checking results...")
        content = page.text_content('body')
        
        # Find payout count
        payout_match = re.search(r'(\d+)\s+Payouts', content)
        if payout_match:
            print(f"   Payouts: {payout_match.group(1)}")
        
        # Find fraud count
        fraud_match = re.search(r'(\d+)\s+Fraud Flags', content)
        if fraud_match:
            print(f"   Fraud Flags: {fraud_match.group(1)}")
        
        # Find total amount
        total_match = re.search(r'Rs\.([\d,]+)', content)
        if total_match:
            print(f"   Total Payouts: Rs.{total_match.group(1)}")
        
        # Check for riders table
        rows = page.locator('.results-table')
        if rows.count() > 0:
            print(f"   Rider rows found: {rows.count()}")
            
            # Click first row to expand
            rows.first.click()
            page.wait_for_timeout(500)
            page.screenshot(path='D:/Code/Guidwire/gigguard/frontend/test_results/5_expanded.png')
            print("   Expanded first rider details")
            
            # Check for fraud checks
            fraud_checks = page.locator('.fraud-check-item')
            if fraud_checks.count() > 0:
                print(f"   Fraud check items: {fraud_checks.count()}")
            
            # Check for signal chips
            signal_chips = page.locator('.signal-chip')
            if signal_chips.count() > 0:
                print(f"   Signal chips: {signal_chips.count()}")
    else:
        print("   Run Simulation button not found!")
        page.screenshot(path='D:/Code/Guidwire/gigguard/frontend/test_results/error.png')
    
    if errors:
        print(f"\nConsole errors: {errors[:5]}")
    else:
        print("\nNo console errors!")
    
    browser.close()
    print("\nTest completed successfully!")
