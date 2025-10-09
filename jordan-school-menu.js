/**
 * Jordan School Menu Web Component
 * Usage: <jordan-school-menu></jordan-school-menu>
 * 
 * Automatically displays today's breakfast and lunch menu from Rosamond Elementary School
 * No props required - always shows today's menu
 */
class JordanSchoolMenu extends HTMLElement {
    constructor() {
        super();
        
        // State to track if we're showing today or tomorrow's menu
        this.showingToday = true;
        
        // Create shadow DOM for encapsulation
        this.attachShadow({ mode: 'open' });
        
        // Create the component HTML
        this.shadowRoot.innerHTML = `
            <style>
                :host {
                    display: block;
                    font-family: Arial, sans-serif;
                    width: 50vw;
                    height: 90vh;
                    overflow-y: auto;
                    margin: 0 auto;
                    padding: 20px;
                    line-height: 1.6;
                }

                @media (max-width: 600px) {
                    :host {
                        width: 90vw;
                        height: 90vh;
                        padding: 10px;
                    }
                }

                .current-date {
                    font-size: 1.2em;
                    font-weight: bold;
                    margin-bottom: 20px;
                    color: #333;
                    cursor: pointer;
                    padding: 10px;
                    border-radius: 8px;
                    transition: background-color 0.2s ease, transform 0.1s ease;
                    user-select: none;
                }

                .current-date:hover {
                    background-color: #f0f7ff;
                }

                .current-date:active {
                    transform: translateY(0);
                }

                .menu-container {
                    background: #f4f4f4;
                    padding: 0 14px;
                    margin: 10px 0;
                    border-radius: 6px;
                    border-left: 4px solid #368dda;
                }

                .meal-section {
                    margin: 0;
                }

                .meal-section h3 {
                    margin: 0;
                    font-size: 1.2em;
                    line-height: 1;
                    padding: 14px 0 6px 0;
                    color: #333;
                }

                .meal-content {
                    margin: 8px 0 0 24px;
                    line-height: 1.4;
                    padding-bottom: 12px;
                    white-space: pre-line;
                }

                .menu-section {
                    margin-bottom: 0.5em;
                }

                .menu-section:last-child {
                    margin-bottom: 0;
                }

                .loading {
                    color: #666;
                    font-style: italic;
                }

                .error {
                    color: #d32f2f;
                    font-weight: bold;
                }

                hr {
                    border: none;
                    border-top: 2px solid #dadada;
                    margin: 0;
                }
            </style>
            
            <div class="current-date" id="currentDate"></div>
            
            <div class="menu-container">
                <div class="meal-section">
                    <h3>🍳 Breakfast</h3>
                    <div class="meal-content loading" id="breakfast">Loading menu...</div>
                </div>
            </div>
            
            <div class="menu-container">
                <div class="meal-section">
                    <h3>🍕 Lunch</h3>
                    <div class="meal-content loading" id="lunch">Loading menu...</div>
                </div>
            </div>
        `;
    }
    
    connectedCallback() {
        // Component is attached to DOM, initialize it
        this.displayCurrentDate();
        this.loadMenu();
        
        // Add click event listener to date header for toggling
        const dateElement = this.shadowRoot.getElementById('currentDate');
        dateElement.addEventListener('click', () => {
            this.toggleDayView();
        });
    }
    
    /**
     * Toggle between showing today's and tomorrow's menu
     */
    toggleDayView() {
        // Toggle the state
        this.showingToday = !this.showingToday;
        
        // Update the date display
        this.displayCurrentDate();
        
        // Reload the menu for the new date
        this.loadMenu();
    }
    
    displayCurrentDate() {
        const today = new Date();
        const targetDate = this.showingToday ? today : new Date(today.getTime() + 24 * 60 * 60 * 1000);
        const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
        const dayLabel = this.showingToday ? 'TODAY' : 'TOMORROW';
        const dateElement = this.shadowRoot.getElementById('currentDate');
        dateElement.textContent = `School Menu for ${dayLabel} - ${targetDate.toLocaleDateString('en-US', options)}`;
    }
    
    async loadMenu() {
        const breakfastElement = this.shadowRoot.getElementById('breakfast');
        const lunchElement = this.shadowRoot.getElementById('lunch');
        
        // Show loading state
        breakfastElement.textContent = 'Loading real menu data...';
        lunchElement.textContent = 'Loading real menu data...';
        breakfastElement.className = 'meal-content loading';
        lunchElement.className = 'meal-content loading';

        try {
            // Get date for menu (today or tomorrow)
            const targetDate = this.showingToday ? new Date() : new Date(Date.now() + 24 * 60 * 60 * 1000);
            
            // Get REAL menu data for the target date
            const menu = await this.getSchoolFoodForDate(targetDate);

            // Update display with real data
            breakfastElement.innerHTML = menu.breakfast;
            lunchElement.innerHTML = menu.lunch;
            breakfastElement.className = 'meal-content';
            lunchElement.className = 'meal-content';

            // Log success
            console.log('✅ Jordan School Menu: Successfully loaded REAL menu data:', menu);

        } catch (error) {
            console.error('❌ Jordan School Menu: Failed to load real menu data:', error.message);

            // Show error message
            const errorMsg = `Error: ${error.message}`;
            breakfastElement.textContent = errorMsg;
            lunchElement.textContent = errorMsg;
            breakfastElement.className = 'meal-content error';
            lunchElement.className = 'meal-content error';
        }
    }
    
    /**
     * Get school food menu for a specific date from Rosamond Elementary School
     * Uses the Vercel API to bypass CORS restrictions
     */
    async getSchoolFoodForDate(targetDate = new Date()) {
        const year = targetDate.getFullYear();
        const month = String(targetDate.getMonth() + 1).padStart(2, '0');
        const day = String(targetDate.getDate()).padStart(2, '0');
        const dateStr = `${year}-${month}-${day}`;
        
        try {
            console.log(`Jordan School Menu: Fetching real menu data for ${dateStr}...`);
            
            // Use the correct Vercel API endpoint regardless of where the component is hosted
            const baseUrl = 'https://jordan-school-district-lunch-menu.vercel.app';
            
            // Call Vercel API routes
            const [breakfastResponse, lunchResponse] = await Promise.all([
                fetch(`${baseUrl}/api/menu?mealType=breakfast&date=${dateStr}`),
                fetch(`${baseUrl}/api/menu?mealType=lunch&date=${dateStr}`)
            ]);
            
            if (!breakfastResponse.ok) {
                throw new Error(`Breakfast API failed: ${breakfastResponse.status}`);
            }
            if (!lunchResponse.ok) {
                throw new Error(`Lunch API failed: ${lunchResponse.status}`);
            }
            
            const [breakfastData, lunchData] = await Promise.all([
                breakfastResponse.json(),
                lunchResponse.json()
            ]);
            
            console.log('✅ Jordan School Menu: Successfully fetched live menu data from school API');
            
            // Find today's menu from the weekly data
            const todayDate = `${year}-${month}-${day}`;
            
            const breakfastMenu = this.findTodaysMenu(breakfastData, todayDate);
            const lunchMenu = this.findTodaysMenu(lunchData, todayDate);
            
            return {
                breakfast: this.formatMenuItems(breakfastMenu),
                lunch: this.formatMenuItems(lunchMenu)
            };
            
        } catch (error) {
            console.error('❌ Jordan School Menu: Failed to fetch real menu data:', error);
            throw new Error(`Unable to fetch real menu data: ${error.message}`);
        }
    }
    
    findTodaysMenu(weekData, targetDate) {
        if (!weekData || !weekData.days) {
            throw new Error('Invalid menu data structure received from API');
        }
        
        const todayMenu = weekData.days.find(day => day.date === targetDate);
        if (!todayMenu) {
            console.warn(`Jordan School Menu: No menu found for ${targetDate}`);
            return [];
        }
        
        return todayMenu.menu_items || [];
    }
    
    formatMenuItems(menuItems) {
        if (!menuItems || menuItems.length === 0) {
            return 'No menu available for today';
        }
        
        // Parse the structured menu data
        const sections = {
            option1: [],
            option2: [],
            sides: []
        };
        
        let currentSection = null;
        
        for (const item of menuItems) {
            // Check if this is a section header
            if (item.is_station_header && item.text) {
                const sectionText = item.text.toLowerCase();
                if (sectionText.includes('option 1')) {
                    currentSection = 'option1';
                } else if (sectionText.includes('option 2')) {
                    currentSection = 'option2';
                } else if (sectionText.includes('side')) {
                    currentSection = 'sides';
                }
            }
            // If this is a food item (not a header)
            else if (!item.is_station_header && item.food && item.food.name) {
                let foodName = item.food.name.trim();
                // Clean up the food name by removing ", WG" (case insensitive)
                foodName = foodName.replace(/,\s*WG\b/gi, '');
                // also remove (El)
                foodName = foodName.replace(/\s*\(El\)\s*/gi, '');
                // strip commas from single food items
                foodName = foodName.replace(/,/g, '');
                if (foodName && currentSection) {
                    sections[currentSection].push(foodName);
                }
            }
        }
        
        // Format the output
        let result = '';
        
        if (sections.option1.length > 0) {
            result += `<div class="menu-section"><b>Option 1</b>: ${sections.option1.join(', ')}</div>`;
        }
        
        if (sections.option2.length > 0) {
            result += `<div class="menu-section"><b>Option 2</b>: ${sections.option2.join(', ')}</div>`;
        }
        
        if (sections.sides.length > 0) {
            result += `<div class="menu-section"><b>Sides</b>: ${sections.sides.map(side => `${side}`).join(', ')}</div>`;
        }
        
        // If no structured data found, fall back to simple list
        if (!result) {
            const allFoods = menuItems
                .filter(item => !item.is_station_header && item.food && item.food.name)
                .map(item => item.food.name.replace(/,\s*WG\b/gi, '')) // Clean up WG here too
                .filter(name => name && name.trim() !== '');
            
            result = allFoods.length > 0 ? allFoods.join(' or ') : 'No menu items available for today';
        }
        
        return result;
    }
}

// Register the custom element
customElements.define('jordan-school-menu', JordanSchoolMenu);