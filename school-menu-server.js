/**
 * Get school food menu for today from Rosamond Elementary School
 * Uses our own server API to bypass CORS restrictions
 * Returns format: { breakfast: 'item1 and item2 or item3', lunch: 'item1 and item2 or item3' }
 */
async function getSchoolFoodForToday() {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    const dateStr = `${year}-${month}-${day}`;
    
    try {
        console.log(`Fetching real menu data for ${dateStr}...`);
        
        // Call Vercel API routes
        const [breakfastResponse, lunchResponse] = await Promise.all([
            fetch(`/api/menu?mealType=breakfast&date=${dateStr}`),
            fetch(`/api/menu?mealType=lunch&date=${dateStr}`)
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
        
        console.log('✅ Successfully fetched live menu data from school API');
        
        // Find today's menu from the weekly data
        const todayDate = `${year}-${month}-${day}`;
        
        const breakfastMenu = findTodaysMenu(breakfastData, todayDate);
        const lunchMenu = findTodaysMenu(lunchData, todayDate);
        
        return {
            breakfast: formatMenuItems(breakfastMenu),
            lunch: formatMenuItems(lunchMenu)
        };
        
    } catch (error) {
        console.error('❌ Failed to fetch real menu data:', error);
        throw new Error(`Unable to fetch real menu data: ${error.message}`);
    }
}

// Helper functions (same as before)
function findTodaysMenu(weekData, targetDate) {
    if (!weekData || !weekData.days) {
        throw new Error('Invalid menu data structure received from API');
    }
    
    const todayMenu = weekData.days.find(day => day.date === targetDate);
    if (!todayMenu) {
        console.warn(`No menu found for ${targetDate}`);
        return [];
    }
    
    return todayMenu.menu_items || [];
}

function formatMenuItems(menuItems) {
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
            if (foodName && currentSection) {
                sections[currentSection].push(foodName);
            }
        }
    }
    
    // Format the output
    let result = '';
    
    if (sections.option1.length > 0) {
        result += `Option 1: ${sections.option1.join(' and ')}`;
    }
    
    if (sections.option2.length > 0) {
        if (result) result += '\n';
        result += `Option 2: ${sections.option2.join(' and ')}`;
    }
    
    if (sections.sides.length > 0) {
        if (result) result += '\n';
        result += `Sides: ${sections.sides.map(side => `${side}`).join(', ')}`;
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