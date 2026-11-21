
//  Smooth Page Loader Timer
window.addEventListener("load", () => setTimeout(() => document.getElementById("loader").classList.add("hide"), 900));
const body = document.body;
const progressFill = document.getElementById('progressFill');
const skipLoader = document.getElementById('skipLoader');
let progress = 0;
function finishLoader() {
    body.classList.remove('loading');
    body.classList.add('loaded');
}
const loaderInterval = setInterval(() => {
    progress += 5;
    if (progressFill) progressFill.style.width = progress + '%';
    if (progress >= 100) {
        clearInterval(loaderInterval);
        setTimeout(finishLoader, 3000);
    }
}, 100);
skipLoader.addEventListener('click', () => {
    clearInterval(loaderInterval);
    finishLoader();
});


//footer year update
document.getElementById("year").textContent = new Date() .getFullYear();


//PUBLIC HOMEPAGE UNIT TIERS DATA ---
let billingCycle = 'monthly'; // 'monthly' or 'semester'
let pendingAuthTargetTab = 'overview';
let pendingPreselectedUnitId = null;

const unitTiers = [
    // Unit cards are sourced from the public room catalog in renderUnitCards().
];
const CAMPUS_DATABASE_KEY = 'campusnest_database_v1';

function loadCampusDatabase() {
    try {
        const saved = localStorage.getItem(CAMPUS_DATABASE_KEY);
        if (saved) return JSON.parse(saved);
    } catch (error) {
        console.warn('Unable to read local CampusNest database:', error);
    }
    return null;
}

function saveCampusDatabase() {
    const database = loadCampusDatabase() || {};
    database.units = vacantRoomsInventory;
    if (currentTenant) database.lastTenant = currentTenant;
    database.updatedAt = new Date().toISOString();
    localStorage.setItem(CAMPUS_DATABASE_KEY, JSON.stringify(database));
}

// --- 2. TENANT PORTAL STATE & VACANT INVENTORY ---
let currentTenant = null; // Null when logged out
let isLandlordLoggedIn = false;

const demoTenantProfile = {
    fullName: 'Faith Wanjiku',
    email: 'faith.wanjiku@students.jkuat.ac.ke',
    regNo: 'SCT221-0418/2024',
    nationalId: '38910452',
    phone: '254712345678',
    university: 'JKUAT Juja',
    guardianName: 'Mrs. Grace Wanjiku',
    guardianPhone: '254722890112',
    hasActiveRoom: true,
    roomCode: 'Unit B-14',
    block: 'Block B (2nd Floor)',
    roomType: 'Modern En-Suite Bedsitter',
    accountRef: 'JJA-B14',
    meterNumber: '3720-8841-904',
    monthlyRent: 8500,
    semesterRent: 32000,
    balanceDue: 4500,
    receipts: [
        {
            code: 'UKH4M91P2Q',
            date: '03 Nov 2026, 09:42 AM',
            description: 'November 2026 Partial Rent (Parent Pay)',
            phone: '254722890112',
            amount: 4000,
            ref: 'JJA-B14'
        },
        {
            code: 'UJF8N20K7R',
            date: '04 Oct 2026, 02:18 PM',
            description: 'October 2026 Full Monthly Rent + Wi-Fi',
            phone: '254712345678',
            amount: 8500,
            ref: 'JJA-B14'
        },
        {
            code: 'UIA2L55V9W',
            date: '02 Sep 2026, 11:05 AM',
            description: 'September Rent + Refundable Security Deposit',
            phone: '254722890112',
            amount: 17000,
            ref: 'JJA-B14'
        }
    ],
    tickets: [
        {
            id: 'TCK-104',
            recipient: 'Resident Caretaker (Mr. Mwangi)',
            category: 'Wi-Fi & Internet',
            urgency: 'Medium',
            subject: 'Router signal weak near study desk',
            details: 'Block B 2nd floor corridor repeater drops connection around 8 PM.',
            status: 'In Progress',
            date: '16 Nov 2026',
            reply: 'Caretaker Mr. Mwangi: Fiber technician scheduled today at 4:00 PM to reposition the corridor access point.'
        },
        {
            id: 'TCK-098',
            recipient: 'Resident Caretaker (Mr. Mwangi)',
            category: 'Plumbing & Water',
            urgency: 'Low',
            subject: 'Instant shower heater pressure check',
            details: 'Water pressure slightly low in the morning.',
            status: 'Resolved',
            date: '28 Oct 2026',
            reply: 'Caretaker Mr. Mwangi: Cleaned showerhead filter and boosted roof tank valve. Confirmed working.'
        }
    ]
};

// Real-time Vacant Rooms & Bed Spaces Inventory
let vacantRoomsInventory = [
    {
        id: 'VAC-01',
        roomCode: 'Unit A-08',
        block: 'Block A • 1st Floor',
        campus: 'JKUAT',
        campusLabel: 'JKUAT Juja Gate C',
        category: 'Bedsitter',
        title: 'Modern En-Suite Bedsitter',
        accountRef: 'JJA-A08',
        monthlyPrice: 8500,
        semesterPrice: 32000,
        features: 'Private shower/toilet, granite sink, balcony, 50Mbps Wi-Fi',
        status: 'Vacant'
    },
    {
        id: 'VAC-02',
        roomCode: 'Room C-03',
        block: 'Block C • Ground Floor',
        campus: 'JKUAT',
        campusLabel: 'JKUAT Juja Gate C',
        category: 'Single',
        title: 'Standard Single Room',
        accountRef: 'JJA-C03',
        monthlyPrice: 4500,
        semesterPrice: 16500,
        features: 'Private lockable room, study desk, wardrobe, shared tiled washrooms',
        status: 'Vacant'
    },
    {
        id: 'VAC-03',
        roomCode: 'Studio D-11 (Bed B)',
        block: 'Block D • 2nd Floor',
        campus: 'KU',
        campusLabel: 'KU Kahawa Wendani',
        category: 'Shared',
        title: 'Shared Dual Studio (1 Bed Open)',
        accountRef: 'KU-D11-B',
        monthlyPrice: 6000,
        semesterPrice: 22500,
        features: '2-sharing en-suite studio, separate bed/desk/wardrobe, hot shower',
        status: 'Vacant'
    },
    {
        id: 'VAC-04',
        roomCode: 'Unit E-05',
        block: 'Block E • 3rd Floor',
        campus: 'KU',
        campusLabel: 'KU Kahawa Wendani',
        category: 'Bedsitter',
        title: 'Modern En-Suite Bedsitter',
        accountRef: 'KU-E05',
        monthlyPrice: 8500,
        semesterPrice: 32000,
        features: 'Self-contained, rooftop study deck access, individual KPLC token',
        status: 'Vacant'
    },
    {
        id: 'VAC-05',
        roomCode: 'Suite F-02',
        block: 'Block F • 1st Floor',
        campus: 'JKUAT',
        campusLabel: 'JKUAT Juja Gate C',
        category: '1-Bedroom',
        title: 'Executive 1-Bedroom Apartment',
        accountRef: 'JJA-F02',
        monthlyPrice: 13500,
        semesterPrice: 50000,
        features: 'Separate living room & bedroom, spacious kitchen, balcony, parking',
        status: 'Vacant'
    },
    {
        id: 'VAC-06',
        roomCode: 'Studio D-14 (Bed A)',
        block: 'Block D • 3rd Floor',
        campus: 'KU',
        campusLabel: 'KU Kahawa Wendani',
        category: 'Shared',
        title: 'Shared Dual Studio (1 Bed Open)',
        accountRef: 'KU-D14-A',
        monthlyPrice: 6000,
        semesterPrice: 22500,
        features: '2-sharing en-suite studio, independent M-Pesa ref, free Wi-Fi',
        status: 'Vacant'
    }
];

let selectedVacancyRoom = null;

const savedDatabase = loadCampusDatabase();
if (savedDatabase?.units?.length) {
    vacantRoomsInventory = savedDatabase.units;
}


// --- 3. RENDER PUBLIC UNIT CARDS ---
function setBillingCycle(cycle) {
    billingCycle = cycle;
    const mBtn = document.getElementById('billMonthlyBtn');
    const sBtn = document.getElementById('billSemesterBtn');
    if (cycle === 'monthly') {
        mBtn.className = 'px-3.5 py-2 rounded-lg text-xs font-bold bg-white text-slate-900 shadow-sm transition-all cursor-pointer';
        sBtn.className = 'px-3.5 py-2 rounded-lg text-xs font-bold text-slate-600 hover:text-slate-900 transition-all cursor-pointer';
    } else {
        sBtn.className = 'px-3.5 py-2 rounded-lg text-xs font-bold bg-white text-slate-900 shadow-sm transition-all cursor-pointer';
        mBtn.className = 'px-3.5 py-2 rounded-lg text-xs font-bold text-slate-600 hover:text-slate-900 transition-all cursor-pointer';
    }
    renderUnitCards();
}

function renderUnitCards() {
    const campusFilter = document.getElementById('campusFilter').value;
    const grid = document.getElementById('unitCardsGrid');

    const filtered = [
        {
            id: 'single',
            campus: 'JKUAT',
            campusLabel: 'JKUAT Juja Gate C',
            title: 'Standard Single Room',
            monthly: 4500,
            semester: 16500,
            desc: 'Private lockable room with study desk, chair, and wardrobe. Shared clean tiled washrooms per floor.',
            badge: 'Budget Friendly',
            popular: false,
            image: 'https://images.unsplash.com/photo-1598928506311-c55ded91a20c?auto=format&fit=crop&w=600&q=80'
        },
        {
            id: 'bedsitter',
            campus: 'JKUAT',
            campusLabel: 'JKUAT Juja Gate C',
            title: 'Modern En-Suite Bedsitter',
            monthly: 8500,
            semester: 32000,
            desc: 'Self-contained with private shower, toilet, kitchenette sink, and private balcony. Best seller for students.',
            badge: 'Most Popular',
            popular: true,
            image: 'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?auto=format&fit=crop&w=600&q=80'
        },
        {
            id: 'dual',
            campus: 'KU',
            campusLabel: 'KU Kahawa Wendani',
            title: 'Shared Dual Studio (Bed)',
            monthly: 6000,
            semester: 22500,
            desc: '2-sharing spacious studio apartment. Each student gets an independent bed space, study desk, and wardrobe.',
            badge: 'Great for Roommates',
            popular: false,
            image: 'https://images.unsplash.com/photo-1555854877-bab0e564b8d5?auto=format&fit=crop&w=600&q=80'
        },
        {
            id: 'onebed',
            campus: 'KU',
            campusLabel: 'KU Kahawa Wendani',
            title: 'Executive 1-Bedroom Apartment',
            monthly: 13500,
            semester: 50000,
            desc: 'Separate living room, bedroom, kitchen, and bathroom. Ideal for senior students or sharing couples.',
            badge: 'Premium Comfort',
            popular: false,
            image: 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=600&q=80'
        }
    ].filter(u => campusFilter === 'ALL' || u.campus === campusFilter);

    grid.innerHTML = filtered.map(u => {
        const price = billingCycle === 'monthly' ? u.monthly : u.semester;
        const priceLabel = billingCycle === 'monthly' ? 'KES ' + u.monthly.toLocaleString() + ' <span class="text-xs font-normal text-slate-500">/ mo</span>' : 'KES ' + u.semester.toLocaleString() + ' <span class="text-xs font-normal text-slate-500">/ sem</span>';

        return `
                        <div class="bg-white rounded-2xl border ${u.popular ? 'border-mpesa shadow-lg' : 'border-slate-200'} overflow-hidden flex flex-col justify-between transition-all hover:shadow-md">
                            <div>
                                <div class="relative h-48 bg-slate-100 overflow-hidden">
                                    <img src="${u.image}" onerror="this.src='https://placehold.co/600x400/1e293b/00A651?text=CampusNest'" alt="${u.title}" class="w-full h-full object-cover">
                                    <div class="absolute top-3 left-3 bg-slate-900/85 backdrop-blur-xs text-white text-[11px] font-bold px-2.5 py-1 rounded-full">
                                        ${u.campusLabel}
                                    </div>
                                    <div class="absolute top-3 right-3 ${u.popular ? 'bg-mpesa text-white' : 'bg-white text-slate-800'} text-[11px] font-extrabold px-2.5 py-1 rounded-full shadow">
                                        ${u.badge}
                                    </div>
                                </div>
                                <div class="p-5 space-y-2">
                                    <h3 class="font-extrabold text-slate-900 text-lg">${u.title}</h3>
                                    <p class="text-xs text-slate-600 leading-relaxed">${u.desc}</p>
                                    <div class="pt-2">
                                        <p class="text-xl font-black text-slate-900">${priceLabel}</p>
                                        <p class="text-[11px] text-slate-400 mt-0.5">Includes Wi-Fi, Water & Garbage</p>
                                    </div>
                                </div>
                            </div>
    
                            <!-- Card CTA -->
                            <div class="p-5 pt-0">
                                <button onclick="bookUnitViaMpesa('${u.id}', ${price})" class="w-full py-3 px-4 rounded-xl ${u.popular ? 'bg-mpesa hover:bg-mpesa-dark text-white' : 'bg-slate-900 hover:bg-slate-800 text-white'} text-xs font-bold transition-colors flex items-center justify-center gap-2 cursor-pointer">
                                    <span>Book / Reserve via M-Pesa</span>
                                </button>
                            </div>
                        </div>
                    `;
    }).join('');
}


// --- 4. APP SURFACE & TENANT AUTHENTICATION FLOW ---
function switchAppSurface(surface) {
    const publicView = document.getElementById('publicHomepageView');
    const portalView = document.getElementById('tenantDashboardView');
    const landlordView = document.getElementById('landlordDashboardView');
    const publicLinks = document.getElementById('publicNavLinks');
    const portalBadge = document.getElementById('portalNavBadge');
    const toggleLabel = document.getElementById('toggleSurfaceBtnLabel');

    if (surface === 'portal') {
        if (!currentTenant) {
            openAuthModal('login', 'overview');
            return;
        }
        landlordView.classList.add('hidden');
        publicView.classList.add('hidden');
        portalView.classList.remove('hidden');
        publicLinks.classList.add('hidden');
        portalBadge.classList.remove('hidden');
        if (toggleLabel) toggleLabel.textContent = 'Public Homepage';
        window.scrollTo({ top: 0, behavior: 'smooth' });
    } else if (surface === 'landlord') {
        if (!isLandlordLoggedIn) {
            openLandlordLoginModal();
            return;
        }
        publicView.classList.add('hidden');
        portalView.classList.add('hidden');
        landlordView.classList.remove('hidden');
        publicLinks.classList.add('hidden');
        portalBadge.classList.add('hidden');
        if (toggleLabel) toggleLabel.textContent = 'Public Homepage';
        renderLandlordDashboard();
        window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
        landlordView.classList.add('hidden');
        portalView.classList.add('hidden');
        publicView.classList.remove('hidden');
        publicLinks.classList.remove('hidden');
        portalBadge.classList.add('hidden');
        if (toggleLabel) toggleLabel.textContent = 'My Tenant Portal';
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }
    if (window.lucide) lucide.createIcons();
}

function toggleAppSurface() {
    const portalHidden = document.getElementById('tenantDashboardView').classList.contains('hidden');
    const landlordHidden = document.getElementById('landlordDashboardView').classList.contains('hidden');
    if (!landlordHidden) {
        switchAppSurface('public');
    } else {
        switchAppSurface(portalHidden ? 'portal' : 'public');
    }
}

function handleBookVacancyEntry() {
    if (currentTenant) {
        switchAppSurface('portal');
        switchTenantTab('vacancy');
    } else {
        openAuthModal('login', 'vacancy');
    }
}

function bookUnitViaMpesa(unitId, amount) {
    pendingPreselectedUnitId = unitId;
    if (currentTenant) {
        switchAppSurface('portal');
        switchTenantTab('vacancy');
        preselectVacancyByCategory(unitId);
    } else {
        openAuthModal('login', 'vacancy');
    }
}

function openAuthModal(tab = 'login', targetTab = 'overview') {
    pendingAuthTargetTab = targetTab;
    const modal = document.getElementById('authModal');
    modal.classList.remove('hidden');
    modal.classList.add('flex');
    switchAuthTab(tab);
    if (window.lucide) lucide.createIcons();
}

function closeAuthModal() {
    const modal = document.getElementById('authModal');
    modal.classList.add('hidden');
    modal.classList.remove('flex');
}

function switchAuthTab(tab) {
    const loginPanel = document.getElementById('authLoginPanel');
    const signupPanel = document.getElementById('authSignupPanel');
    const tabLogin = document.getElementById('authTabLogin');
    const tabSignup = document.getElementById('authTabSignup');

    if (tab === 'login') {
        loginPanel.classList.remove('hidden');
        signupPanel.classList.add('hidden');
        tabLogin.className = 'py-2 rounded-lg text-xs sm:text-sm font-bold bg-white text-slate-900 shadow-2xs transition-all cursor-pointer';
        tabSignup.className = 'py-2 rounded-lg text-xs sm:text-sm font-bold text-slate-600 hover:text-slate-900 transition-all cursor-pointer';
    } else {
        signupPanel.classList.remove('hidden');
        loginPanel.classList.add('hidden');
        tabSignup.className = 'py-2 rounded-lg text-xs sm:text-sm font-bold bg-white text-slate-900 shadow-2xs transition-all cursor-pointer';
        tabLogin.className = 'py-2 rounded-lg text-xs sm:text-sm font-bold text-slate-600 hover:text-slate-900 transition-all cursor-pointer';
    }
}

function loginDemoStudent() {
    currentTenant = JSON.parse(JSON.stringify(demoTenantProfile));
    completeTenantLogin('Welcome back, Faith Wanjiku! Logged into Unit B-14.');
}

function handleStudentLogin(e) {
    e.preventDefault();
    const idInput = document.getElementById('loginIdentifier').value.trim();
    currentTenant = JSON.parse(JSON.stringify(demoTenantProfile));
    if (idInput && !idInput.includes('faith.wanjiku')) {
        currentTenant.email = idInput;
    }
    completeTenantLogin(`Signed in as ${currentTenant.fullName}.`);
}

function handleStudentSignup(e) {
    e.preventDefault();
    const fullName = document.getElementById('regFullName').value.trim();
    const phone = document.getElementById('regPhone').value.trim();
    const university = document.getElementById('regUniversity').value;
    const regNo = document.getElementById('regAdmissionNo').value.trim();
    const nationalId = document.getElementById('regNationalId').value.trim();
    const guardianName = document.getElementById('regGuardianName').value.trim();
    const guardianPhone = document.getElementById('regGuardianPhone').value.trim();

    if (!/^254(7|1)\d{8}$/.test(phone)) {
        showToast('Invalid Phone Format', 'Please enter Student M-Pesa phone in 2547XXXXXXXX format.');
        return;
    }

    currentTenant = {
        fullName,
        email: `${fullName.toLowerCase().replace(/\s+/g, '.')}@student.ke`,
        regNo,
        nationalId,
        phone,
        university,
        guardianName,
        guardianPhone,
        hasActiveRoom: false,
        roomCode: 'No Room Assigned Yet',
        block: 'Pending Booking',
        roomType: 'Select a Vacant Room to Book',
        accountRef: 'NEW-STUDENT',
        meterNumber: 'Assigned on Check-In',
        monthlyRent: 0,
        semesterRent: 0,
        balanceDue: 0,
        receipts: [],
        tickets: []
    };

    pendingAuthTargetTab = 'vacancy';
    completeTenantLogin(`Account created for ${fullName}! Select a vacant room to book.`);
}

function completeTenantLogin(toastMsg) {
    closeAuthModal();
    const savedDatabase = loadCampusDatabase();
    if (savedDatabase?.lastTenant) {
        const savedTenant = savedDatabase.lastTenant;
        if (savedTenant.email === currentTenant.email || currentTenant.email.includes('faith.wanjiku')) {
            currentTenant = { ...savedTenant, ...currentTenant, receipts: savedTenant.receipts || currentTenant.receipts, tickets: savedTenant.tickets || currentTenant.tickets };
        }
    }
    saveCampusDatabase();
    document.getElementById('headerGuestActions').classList.add('hidden');
    document.getElementById('headerTenantActions').classList.remove('hidden');
    document.getElementById('headerTenantActions').classList.add('flex');

    renderTenantDashboard();
    switchAppSurface('portal');
    switchTenantTab(pendingAuthTargetTab || 'overview');

    if (pendingPreselectedUnitId) {
        preselectVacancyByCategory(pendingPreselectedUnitId);
        pendingPreselectedUnitId = null;
    }

    showToast('Tenant Portal Active', toastMsg);
}

function logoutTenant() {
    currentTenant = null;
    document.getElementById('headerGuestActions').classList.remove('hidden');
    document.getElementById('headerTenantActions').classList.add('hidden');
    document.getElementById('headerTenantActions').classList.remove('flex');
    switchAppSurface('public');
    showToast('Logged Out', 'You have safely signed out of the Student Tenant Portal.');
}

function openLandlordLoginModal() {
    const modal = document.getElementById('landlordLoginModal');
    modal.classList.remove('hidden');
    modal.classList.add('flex');
    if (window.lucide) lucide.createIcons();
}

function closeLandlordLoginModal() {
    const modal = document.getElementById('landlordLoginModal');
    modal.classList.add('hidden');
    modal.classList.remove('flex');
}

function handleLandlordLogin(event) {
    event.preventDefault();
    const email = document.getElementById('landlordLoginEmail').value.trim();
    const password = document.getElementById('landlordLoginPassword').value;
    if (email !== 'admin@campusnest.co.ke' || password !== 'Landlord2026') {
        showToast('Access Denied', 'Use the demo landlord email and password shown below.');
        return;
    }
    isLandlordLoggedIn = true;
    closeLandlordLoginModal();
    document.getElementById('headerGuestActions').classList.add('hidden');
    document.getElementById('headerTenantActions').classList.remove('hidden');
    document.getElementById('headerTenantActions').classList.add('flex');
    switchAppSurface('landlord');
    showToast('Landlord Page Active', 'Property management dashboard opened.');
}

function logoutLandlord() {
    isLandlordLoggedIn = false;
    document.getElementById('headerGuestActions').classList.remove('hidden');
    document.getElementById('headerTenantActions').classList.add('hidden');
    document.getElementById('headerTenantActions').classList.remove('flex');
    switchAppSurface('public');
    showToast('Landlord Signed Out', 'Returned to the public homepage.');
}

function switchLandlordTab(tabName) {
    document.querySelectorAll('.landlord-panel').forEach(panel => panel.classList.add('hidden'));
    const activePanel = document.getElementById(`landlordPanel-${tabName}`);
    if (activePanel) activePanel.classList.remove('hidden');
    document.querySelectorAll('.landlord-tab-btn').forEach(button => {
        button.className = 'landlord-tab-btn shrink-0 w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-bold text-slate-600 hover:bg-slate-100';
    });
    const activeButton = document.getElementById(`landlordTab-${tabName}`);
    if (activeButton) {
        activeButton.className = 'landlord-tab-btn shrink-0 w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-bold bg-slate-900 text-white';
    }
    if (window.lucide) lucide.createIcons();
}

function renderLandlordDashboard() {
    if (!isLandlordLoggedIn) return;
    document.getElementById('landlordTotalUnits').textContent = vacantRoomsInventory.length;
    document.getElementById('landlordVacantUnits').textContent =
        vacantRoomsInventory.filter(unit => unit.status === 'Vacant').length;
    document.getElementById('landlordPaymentCount').textContent =
        currentTenant ? currentTenant.receipts.length : 0;
    document.getElementById('landlordTicketCount').textContent =
        currentTenant ? currentTenant.tickets.filter(ticket => ticket.status !== 'Resolved').length : 0;

    const payments = currentTenant ? currentTenant.receipts.slice(0, 5) : [];
    document.getElementById('landlordRecentPayments').innerHTML = payments.length
        ? payments.map(receipt => `<div class="rounded-xl border border-slate-200 p-3 text-xs"><div class="flex justify-between gap-2"><span class="font-mono font-bold">${receipt.code}</span><span class="font-extrabold text-mpesa-dark">KES ${receipt.amount.toLocaleString()}</span></div><p class="text-slate-500 mt-1">${receipt.description}</p></div>`).join('')
        : '<p class="text-xs text-slate-500 py-4 text-center">No payment records available.</p>';

    const tickets = currentTenant ? currentTenant.tickets.slice(0, 5) : [];
    document.getElementById('landlordRecentTickets').innerHTML = tickets.length
        ? tickets.map(ticket => `<div class="rounded-xl border border-slate-200 p-3 text-xs"><div class="flex justify-between gap-2"><span class="font-bold">${ticket.id} — ${ticket.subject}</span><span class="text-[10px] font-extrabold">${ticket.status}</span></div><p class="text-slate-500 mt-1">${ticket.category} • ${ticket.urgency}</p></div>`).join('')
        : '<p class="text-xs text-slate-500 py-4 text-center">No maintenance requests available.</p>';

    document.getElementById('landlordUnitsGrid').innerHTML = vacantRoomsInventory.map(unit => `
        <div class="border border-slate-200 rounded-2xl p-4">
            <div class="flex items-start justify-between gap-3">
                <div><p class="text-[11px] font-bold uppercase text-slate-400">${unit.campusLabel}</p><h3 class="font-extrabold text-slate-900 mt-1">${unit.roomCode}</h3><p class="text-xs text-slate-500">${unit.title}</p></div>
                <span class="text-[10px] font-extrabold px-2 py-1 rounded-full ${unit.status === 'Vacant' ? 'bg-mpesa-light text-mpesa-dark' : 'bg-slate-200 text-slate-700'}">${unit.status}</span>
            </div>
            <div class="grid grid-cols-2 gap-2 mt-4">
                <select id="landlordStatus-${unit.id}" class="text-xs border border-slate-200 rounded-lg px-2 py-2"><option value="Vacant" ${unit.status === 'Vacant' ? 'selected' : ''}>Vacant</option><option value="Reserved" ${unit.status === 'Reserved' ? 'selected' : ''}>Reserved</option><option value="Booked" ${unit.status === 'Booked' ? 'selected' : ''}>Booked</option></select>
                <input id="landlordRef-${unit.id}" value="${unit.accountRef}" class="text-xs font-mono border border-slate-200 rounded-lg px-2 py-2">
                <input id="landlordMonthly-${unit.id}" type="number" min="0" value="${unit.monthlyPrice}" class="text-xs border border-slate-200 rounded-lg px-2 py-2" aria-label="Monthly rent">
                <input id="landlordSemester-${unit.id}" type="number" min="0" value="${unit.semesterPrice}" class="text-xs border border-slate-200 rounded-lg px-2 py-2" aria-label="Semester rent">
            </div>
            <button onclick="saveLandlordUnit('${unit.id}')" class="mt-3 w-full py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold">Save Unit</button>
        </div>
    `).join('');

    if (currentTenant) {
        document.getElementById('landlordTenantName').value = currentTenant.fullName;
        document.getElementById('landlordTenantPhone').value = currentTenant.phone;
        document.getElementById('landlordTenantBalance').value = currentTenant.balanceDue;
        document.getElementById('landlordTenantMeter').value = currentTenant.meterNumber;
        document.getElementById('landlordTenantLease').value = currentTenant.hasActiveRoom ? 'active' : 'pending';
        document.getElementById('landlordTenantDetails').innerHTML = `<div class="rounded-xl border border-slate-200 bg-slate-50 p-4 text-xs"><p><strong>Room:</strong> ${currentTenant.roomCode}</p><p class="mt-1"><strong>Account Reference:</strong> ${currentTenant.accountRef}</p><p class="mt-1"><strong>University:</strong> ${currentTenant.university}</p></div>`;
    }

    document.getElementById('landlordTicketsList').innerHTML = currentTenant && currentTenant.tickets.length
        ? currentTenant.tickets.map(ticket => `
            <div class="rounded-2xl border border-slate-200 p-4 text-xs">
                <div class="flex flex-wrap items-center justify-between gap-2"><div><span class="font-mono font-bold text-slate-500">${ticket.id}</span> <strong>${ticket.subject}</strong></div><span class="text-[10px] font-extrabold">${ticket.status}</span></div>
                <p class="text-slate-500 mt-2">${ticket.category} • ${ticket.urgency} • ${ticket.recipient}</p>
                <select onchange="updateLandlordTicketStatus('${ticket.id}', this.value)" class="mt-3 w-full sm:w-48 text-xs border border-slate-200 rounded-lg px-2 py-2"><option value="Open" ${ticket.status === 'Open' ? 'selected' : ''}>Open</option><option value="In Progress" ${ticket.status === 'In Progress' ? 'selected' : ''}>In Progress</option><option value="Resolved" ${ticket.status === 'Resolved' ? 'selected' : ''}>Resolved</option></select>
            </div>
        `).join('')
        : '<p class="text-xs text-slate-500 py-6 text-center">No maintenance requests available.</p>';

    if (window.lucide) lucide.createIcons();
}

function saveLandlordUnit(unitId) {
    const unit = vacantRoomsInventory.find(item => item.id === unitId);
    if (!unit) return;
    unit.status = document.getElementById(`landlordStatus-${unitId}`).value;
    unit.accountRef = document.getElementById(`landlordRef-${unitId}`).value.trim();
    unit.monthlyPrice = Number(document.getElementById(`landlordMonthly-${unitId}`).value);
    unit.semesterPrice = Number(document.getElementById(`landlordSemester-${unitId}`).value);
    saveCampusDatabase();
    renderTenantDashboard();
    renderLandlordDashboard();
    showToast('Unit Updated', `${unit.roomCode} saved to the database.`);
}

function saveLandlordTenant(event) {
    event.preventDefault();
    if (!currentTenant) {
        showToast('No Tenant Selected', 'Open the tenant portal first or create a tenant account.');
        return;
    }
    currentTenant.fullName = document.getElementById('landlordTenantName').value.trim();
    currentTenant.phone = document.getElementById('landlordTenantPhone').value.trim();
    currentTenant.balanceDue = Number(document.getElementById('landlordTenantBalance').value);
    currentTenant.meterNumber = document.getElementById('landlordTenantMeter').value.trim();
    currentTenant.hasActiveRoom = document.getElementById('landlordTenantLease').value === 'active';
    saveCampusDatabase();
    renderTenantDashboard();
    renderLandlordDashboard();
    showToast('Tenant Updated', 'Tenant balance and lease details saved.');
}

function updateLandlordTicketStatus(ticketId, status) {
    if (!currentTenant) return;
    const ticket = currentTenant.tickets.find(item => item.id === ticketId);
    if (!ticket) return;
    ticket.status = status;
    saveCampusDatabase();
    renderTenantDashboard();
    renderLandlordDashboard();
    showToast('Ticket Updated', `${ticketId} changed to ${status}.`);
}

// --- 5. TENANT DASHBOARD RENDERING & TAB NAVIGATION ---
function switchTenantTab(tabName) {
    document.querySelectorAll('.tenant-panel').forEach(p => p.classList.add('hidden'));
    const activePanel = document.getElementById(`tenantPanel-${tabName}`);
    if (activePanel) activePanel.classList.remove('hidden');

    document.querySelectorAll('.tenant-tab-btn').forEach(btn => {
        btn.className = 'tenant-tab-btn shrink-0 flex items-center justify-between gap-2.5 px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-bold text-slate-600 hover:bg-slate-100 transition-all cursor-pointer';
    });
    const activeBtn = document.getElementById(`tTab-${tabName}`);
    if (activeBtn) {
        activeBtn.className = 'tenant-tab-btn shrink-0 flex items-center justify-between gap-2.5 px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-bold bg-slate-900 text-white transition-all cursor-pointer';
    }

    if (tabName === 'vacancy') renderVacancyInventory();
    if (tabName === 'receipts') renderReceiptsTable();
    if (tabName === 'complaints') renderComplaintsFeed();
    if (tabName === 'management') renderManagementPanel();
    if (window.lucide) lucide.createIcons();
}

function renderTenantDashboard() {
    if (!currentTenant) return;

    const initials = currentTenant.fullName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
    document.getElementById('tenantAvatarBadge').textContent = initials;
    document.getElementById('dashTenantName').textContent = currentTenant.fullName;

    const statusPill = document.getElementById('dashTenantStatusPill');
    if (currentTenant.hasActiveRoom) {
        statusPill.textContent = 'Active Lease';
        statusPill.className = 'text-[11px] font-extrabold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-mpesa/20 text-mpesa border border-mpesa/30';
    } else {
        statusPill.textContent = 'Pending Room Booking';
        statusPill.className = 'text-[11px] font-extrabold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-400/30';
    }

    document.getElementById('dashTenantMeta').innerHTML = `
                    Reg: <span class="font-mono text-white">${currentTenant.regNo}</span> • ${currentTenant.university} • <strong class="text-mpesa">${currentTenant.roomCode} (${currentTenant.roomType})</strong>
                `;

    // Overview KPIs
    document.getElementById('ovBalanceAmount').textContent = `KES ${currentTenant.balanceDue.toLocaleString()}`;
    const balBadge = document.getElementById('ovBalanceBadge');
    if (currentTenant.balanceDue <= 0) {
        balBadge.textContent = 'Cleared';
        balBadge.className = 'text-[11px] font-extrabold px-2 py-0.5 rounded-full bg-mpesa-light text-mpesa-dark';
        document.getElementById('ovBalanceSub').textContent = 'All rent & utilities paid up to date';
    } else {
        balBadge.textContent = 'Balance Due';
        balBadge.className = 'text-[11px] font-extrabold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800';
        document.getElementById('ovBalanceSub').textContent = 'Current rent & water cycle balance';
    }

    document.getElementById('ovRoomTitle').textContent = currentTenant.hasActiveRoom ? `${currentTenant.block} • ${currentTenant.roomCode}` : 'No Room Booked Yet';
    document.getElementById('ovRoomType').textContent = currentTenant.roomType;
    document.getElementById('ovAccountRef').textContent = currentTenant.accountRef;
    document.getElementById('ovMonthlyRate').textContent = currentTenant.monthlyRent ? `KES ${currentTenant.monthlyRent.toLocaleString()} / mo` : 'Select unit in Book Vacancy';
    document.getElementById('ovMeterNumber').textContent = currentTenant.meterNumber;

    // Payment Tab Sync
    document.getElementById('payMpesaPhone').value = currentTenant.phone;
    document.getElementById('payMpesaAmount').value = currentTenant.balanceDue > 0 ? currentTenant.balanceDue : (currentTenant.monthlyRent || 8500);
    document.getElementById('paybillAccountRefDisplay').textContent = currentTenant.accountRef;

    // Sidebar Badges
    const openVacancies = vacantRoomsInventory.filter(r => r.status === 'Vacant').length;
    document.getElementById('sidebarVacantCountBadge').textContent = `${openVacancies} Open`;
    document.getElementById('sidebarReceiptCountBadge').textContent = currentTenant.receipts.length;
    document.getElementById('sidebarTicketCountBadge').textContent = currentTenant.tickets.length;

    // Overview Recent Payments
    const recList = document.getElementById('ovRecentPaymentsList');
    if (currentTenant.receipts.length === 0) {
        recList.innerHTML = `<p class="text-xs text-slate-500 py-4 text-center bg-slate-50 rounded-xl">No payments yet. Book a vacant room or pay rent via M-Pesa.</p>`;
    } else {
        recList.innerHTML = currentTenant.receipts.slice(0, 3).map(r => `
                        <div class="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200/70 text-xs">
                            <div>
                                <p class="font-bold text-slate-900">${r.description}</p>
                                <p class="text-[11px] text-slate-500 mt-0.5 font-mono">${r.code} • ${r.date}</p>
                            </div>
                            <div class="text-right">
                                <p class="font-extrabold text-mpesa-dark">KES ${r.amount.toLocaleString()}</p>
                                <button onclick="openReceiptModal('${r.code}')" class="text-[11px] font-bold text-blue-600 hover:underline cursor-pointer">Receipt</button>
                            </div>
                        </div>
                    `).join('');
    }

    // Overview Recent Tickets
    const tckList = document.getElementById('ovRecentTicketsList');
    if (currentTenant.tickets.length === 0) {
        tckList.innerHTML = `<p class="text-xs text-slate-500 py-4 text-center bg-slate-50 rounded-xl">No open complaints or repair requests.</p>`;
    } else {
        tckList.innerHTML = currentTenant.tickets.slice(0, 2).map(t => `
                        <div class="p-3 rounded-xl bg-slate-50 border border-slate-200/70 text-xs space-y-1">
                            <div class="flex items-center justify-between">
                                <span class="font-bold text-slate-900">${t.subject}</span>
                                <span class="text-[10px] font-extrabold px-2 py-0.5 rounded-full ${getTicketStatusBadgeClass(t.status)}">${t.status}</span>
                            </div>
                            <p class="text-[11px] text-slate-500">To: ${t.recipient} • ${t.date}</p>
                        </div>
                    `).join('');
    }

    renderVacancyInventory();
    renderReceiptsTable();
    renderComplaintsFeed();
}


// --- 6. BOOK VACANCY & INSTANT ROOM RESERVATION ---
function renderVacancyInventory() {
    const campusFilter = document.getElementById('vacCampusFilter').value;
    const typeFilter = document.getElementById('vacTypeFilter').value;
    const grid = document.getElementById('vacancyRoomsGrid');

    const filtered = vacantRoomsInventory.filter(room => {
        const matchCampus = campusFilter === 'ALL' || room.campus === campusFilter;
        const matchType = typeFilter === 'ALL' || room.category === typeFilter;
        return matchCampus && matchType;
    });

    grid.innerHTML = filtered.map(room => {
        const isBooked = room.status !== 'Vacant';
        return `
                        <div class="border ${isBooked ? 'border-slate-200 bg-slate-50 opacity-75' : 'border-slate-200 bg-white hover:border-mpesa'} rounded-2xl p-4 sm:p-5 flex flex-col justify-between transition-all">
                            <div>
                                <div class="flex items-center justify-between gap-2">
                                    <span class="text-[11px] font-extrabold uppercase tracking-wider text-slate-400">${room.campusLabel} • ${room.block}</span>
                                    <span class="text-[11px] font-extrabold px-2.5 py-0.5 rounded-full ${isBooked ? 'bg-slate-200 text-slate-700' : 'bg-mpesa-light text-mpesa-dark'}">
                                        ${isBooked ? 'Reserved' : 'Vacant Now'}
                                    </span>
                                </div>
                                <div class="flex items-baseline justify-between mt-1.5">
                                    <h3 class="text-base sm:text-lg font-extrabold text-slate-900">${room.roomCode}</h3>
                                    <span class="font-mono text-xs font-bold text-mpesa-dark">Ref: ${room.accountRef}</span>
                                </div>
                                <p class="text-xs font-semibold text-slate-700">${room.title}</p>
                                <p class="text-xs text-slate-500 mt-2 leading-relaxed">${room.features}</p>
                            </div>
    
                            <div class="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between gap-3">
                                <div>
                                    <p class="text-sm font-black text-slate-900">KES ${room.monthlyPrice.toLocaleString()}<span class="text-[11px] font-normal text-slate-500">/mo</span></p>
                                    <p class="text-[11px] text-slate-500">or KES ${room.semesterPrice.toLocaleString()}/sem</p>
                                </div>
                                <button ${isBooked ? 'disabled' : ''} onclick="openVacancyBookingDrawer('${room.id}')"
                                    class="px-4 py-2.5 rounded-xl text-xs font-bold transition-colors ${isBooked ? 'bg-slate-200 text-slate-500 cursor-not-allowed' : 'bg-slate-900 hover:bg-mpesa text-white cursor-pointer'}">
                                    ${isBooked ? 'Booked' : 'Select & Book →'}
                                </button>
                            </div>
                        </div>
                    `;
    }).join('');
}

function preselectVacancyByCategory(unitTierId) {
    const map = { single: 'Single', bedsitter: 'Bedsitter', dual: 'Shared', onebed: '1-Bedroom' };
    const cat = map[unitTierId];
    if (!cat) return;
    const match = vacantRoomsInventory.find(r => r.category === cat && r.status === 'Vacant');
    if (match) openVacancyBookingDrawer(match.id);
}

function openVacancyBookingDrawer(roomId) {
    const room = vacantRoomsInventory.find(r => r.id === roomId);
    if (!room || room.status !== 'Vacant') return;
    selectedVacancyRoom = room;

    const drawer = document.getElementById('vacancyBookingDrawer');
    drawer.classList.remove('hidden');
    document.getElementById('vacBookRoomTitle').textContent = `Reserve ${room.roomCode} — ${room.title}`;
    document.getElementById('vacBookRoomMeta').textContent = `${room.campusLabel} • ${room.block} • Account Ref: ${room.accountRef}`;
    document.getElementById('vacBookPhone').value = currentTenant ? currentTenant.phone : '254712345678';

    recalculateVacancyDeposit();
    drawer.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

function closeVacancyBookingDrawer() {
    selectedVacancyRoom = null;
    document.getElementById('vacancyBookingDrawer').classList.add('hidden');
}

function recalculateVacancyDeposit() {
    if (!selectedVacancyRoom) return;
    const plan = document.getElementById('vacBookPlan').value;
    const deposit = selectedVacancyRoom.monthlyPrice;
    const rentPart = plan === 'monthly' ? selectedVacancyRoom.monthlyPrice : selectedVacancyRoom.semesterPrice;
    const total = rentPart + deposit;

    document.getElementById('vacBookTotalLabel').textContent = `KES ${total.toLocaleString()}`;
    document.getElementById('vacBookBreakdownNote').textContent = plan === 'monthly'
        ? `Includes 1st Month Rent (KES ${rentPart.toLocaleString()}) + 100% Refundable Security Deposit (KES ${deposit.toLocaleString()}). Zero agent fees.`
        : `Includes Full 4-Month Semester Rent (KES ${rentPart.toLocaleString()}) + 100% Refundable Security Deposit (KES ${deposit.toLocaleString()}).`;
}

function executeVacancyMpesaBooking() {
    if (!selectedVacancyRoom || !currentTenant) return;
    const phone = document.getElementById('vacBookPhone').value.trim();
    if (!/^254(7|1)\d{8}$/.test(phone)) {
        showToast('Invalid M-Pesa Phone', 'Enter a valid Kenyan M-Pesa number in 2547XXXXXXXX format.');
        return;
    }

    const plan = document.getElementById('vacBookPlan').value;
    const deposit = selectedVacancyRoom.monthlyPrice;
    const rentPart = plan === 'monthly' ? selectedVacancyRoom.monthlyPrice : selectedVacancyRoom.semesterPrice;
    const totalPaid = rentPart + deposit;

    const btn = document.getElementById('vacConfirmStkBtn');
    const origText = btn.innerHTML;
    btn.disabled = true;
    btn.textContent = 'Sending STK Prompt...';

    setTimeout(() => {
        const mpesaCode = generateMpesaCode();
        selectedVacancyRoom.status = 'Booked';

        // Assign room to current student tenant
        currentTenant.hasActiveRoom = true;
        currentTenant.roomCode = selectedVacancyRoom.roomCode;
        currentTenant.block = selectedVacancyRoom.block;
        currentTenant.roomType = selectedVacancyRoom.title;
        currentTenant.accountRef = selectedVacancyRoom.accountRef;
        currentTenant.monthlyRent = selectedVacancyRoom.monthlyPrice;
        currentTenant.semesterRent = selectedVacancyRoom.semesterPrice;
        currentTenant.meterNumber = '3720-' + Math.floor(1000 + Math.random() * 9000) + '-412';
        currentTenant.balanceDue = 0;

        currentTenant.receipts.unshift({
            code: mpesaCode,
            date: formatCurrentKenyaDate(),
            description: `Room Booking (${selectedVacancyRoom.roomCode}) — ${plan === 'monthly' ? '1st Month' : 'Semester'} + Deposit`,
            phone: phone,
            amount: totalPaid,
            ref: selectedVacancyRoom.accountRef
        });

        btn.disabled = false;
        btn.innerHTML = origText;
        closeVacancyBookingDrawer();
        saveCampusDatabase();
        renderTenantDashboard();
        switchTenantTab('overview');

        showToast(
            'Room Booked & Confirmed!',
            `${selectedVacancyRoom.roomCode} assigned to your account. M-Pesa Receipt: ${mpesaCode}.`
        );
    }, 1800);
}


// --- 7. M-PESA PAYMENTS CENTER (STUDENT & PARENT STK PUSH) ---
function setPayerRole(role) {
    const sBtn = document.getElementById('payerStudentBtn');
    const pBtn = document.getElementById('payerParentBtn');
    const phoneInput = document.getElementById('payMpesaPhone');

    if (role === 'student') {
        sBtn.className = 'py-2.5 px-3 rounded-xl border-2 border-mpesa bg-mpesa-light/40 text-slate-900 text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer';
        pBtn.className = 'py-2.5 px-3 rounded-xl border border-slate-200 bg-white text-slate-600 text-xs font-bold flex items-center justify-center gap-1.5 hover:bg-slate-50 cursor-pointer';
        if (currentTenant) phoneInput.value = currentTenant.phone;
    } else {
        pBtn.className = 'py-2.5 px-3 rounded-xl border-2 border-mpesa bg-mpesa-light/40 text-slate-900 text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer';
        sBtn.className = 'py-2.5 px-3 rounded-xl border border-slate-200 bg-white text-slate-600 text-xs font-bold flex items-center justify-center gap-1.5 hover:bg-slate-50 cursor-pointer';
        if (currentTenant && currentTenant.guardianPhone) phoneInput.value = currentTenant.guardianPhone;
    }
}

function setQuickPayAmount(preset) {
    if (!currentTenant) return;
    const amtInput = document.getElementById('payMpesaAmount');
    const descInput = document.getElementById('payDescription');

    if (preset === 'balance') {
        amtInput.value = currentTenant.balanceDue > 0 ? currentTenant.balanceDue : (currentTenant.monthlyRent || 8500);
        descInput.value = 'Rent & Utilities Balance Payment';
    } else if (preset === 'monthly') {
        amtInput.value = currentTenant.monthlyRent || 8500;
        descInput.value = 'Full Monthly Rent + Fiber Wi-Fi & Water';
    } else if (preset === 'semester') {
        amtInput.value = currentTenant.semesterRent || 32000;
        descInput.value = 'Full Semester Package (4 Months Discounted)';
    }
}

function initiateTenantStkPush() {
    if (!currentTenant) return;
    const phone = document.getElementById('payMpesaPhone').value.trim();
    const amount = Number(document.getElementById('payMpesaAmount').value);
    const desc = document.getElementById('payDescription').value.trim() || 'Student Rent Payment';

    if (!/^254(7|1)\d{8}$/.test(phone)) {
        document.getElementById('payPhoneError').classList.remove('hidden');
        return;
    }
    document.getElementById('payPhoneError').classList.add('hidden');

    if (!amount || amount < 100) {
        showToast('Invalid Amount', 'Please enter at least KES 100.');
        return;
    }

    document.getElementById('portalStkFormBox').classList.add('hidden');
    document.getElementById('portalStkProcessingBox').classList.remove('hidden');
    document.getElementById('portalStkTargetPhone').textContent = phone;
    document.getElementById('portalStkTargetAmt').textContent = `KES ${amount.toLocaleString()}`;

    setTimeout(() => {
        const receiptCode = generateMpesaCode();
        currentTenant.balanceDue = Math.max(0, currentTenant.balanceDue - amount);

        currentTenant.receipts.unshift({
            code: receiptCode,
            date: formatCurrentKenyaDate(),
            description: desc,
            phone: phone,
            amount: amount,
            ref: currentTenant.accountRef
        });

        document.getElementById('portalStkReceiptCode').textContent = receiptCode;
        document.getElementById('portalStkCreditedRef').textContent = currentTenant.accountRef;

        document.getElementById('portalStkProcessingBox').classList.add('hidden');
        document.getElementById('portalStkSuccessBox').classList.remove('hidden');

        saveCampusDatabase();
        renderTenantDashboard();
        showToast('M-Pesa Payment Confirmed', `Receipt ${receiptCode} for KES ${amount.toLocaleString()} added to your ledger.`);
    }, 2000);
}

function resetTenantStkBox() {
    document.getElementById('portalStkFormBox').classList.remove('hidden');
    document.getElementById('portalStkProcessingBox').classList.add('hidden');
    document.getElementById('portalStkSuccessBox').classList.add('hidden');
}

function copyPaybillDetails() {
    const ref = currentTenant ? currentTenant.accountRef : 'JJA-B14';
    const text = `CampusNest Kenya M-Pesa Paybill: 4092184 | Account Number: ${ref}`;
    const temp = document.createElement('textarea');
    temp.value = text;
    document.body.appendChild(temp);
    temp.select();
    document.execCommand('copy');
    document.body.removeChild(temp);
    showToast('Paybill Copied', `Copied "${text}" to clipboard for sharing with parent.`);
}


// --- 8. OFFICIAL RECEIPTS TABLE & PRINTABLE MODAL ---
function renderReceiptsTable() {
    if (!currentTenant) return;
    const tbody = document.getElementById('tenantReceiptsTableBody');

    if (currentTenant.receipts.length === 0) {
        tbody.innerHTML = `<tr><td colspan="6" class="py-8 text-center text-slate-500">No payment receipts found yet.</td></tr>`;
        return;
    }

    tbody.innerHTML = currentTenant.receipts.map(r => `
                    <tr class="hover:bg-slate-50/80">
                        <td class="py-3 px-3 font-mono font-bold text-slate-900">${r.code}</td>
                        <td class="py-3 px-3 text-slate-600">${r.date}</td>
                        <td class="py-3 px-3 font-medium text-slate-800">${r.description}</td>
                        <td class="py-3 px-3 font-mono text-slate-600">${r.phone}</td>
                        <td class="py-3 px-3 text-right font-extrabold text-mpesa-dark">KES ${r.amount.toLocaleString()}</td>
                        <td class="py-3 px-3 text-right">
                            <button onclick="openReceiptModal('${r.code}')" class="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-[11px] font-bold cursor-pointer">
                                <i data-lucide="file-text" class="w-3.5 h-3.5"></i>
                                <span>View / Print</span>
                            </button>
                        </td>
                    </tr>
                `).join('');
    if (window.lucide) lucide.createIcons();
}

function openReceiptModal(code) {
    if (!currentTenant) return;
    const rec = currentTenant.receipts.find(r => r.code === code);
    if (!rec) return;

    document.getElementById('recModalCode').textContent = rec.code;
    document.getElementById('recModalDate').textContent = rec.date;
    document.getElementById('recModalStudent').textContent = `${currentTenant.fullName} (${currentTenant.regNo})`;
    document.getElementById('recModalRef').textContent = `${rec.ref} (${currentTenant.roomCode})`;
    document.getElementById('recModalPhone').textContent = rec.phone;
    document.getElementById('recModalDesc').textContent = rec.description;
    document.getElementById('recModalAmount').textContent = `KES ${rec.amount.toLocaleString()}`;

    const modal = document.getElementById('receiptModal');
    modal.classList.remove('hidden');
    modal.classList.add('flex');
    if (window.lucide) lucide.createIcons();
}

function closeReceiptModal() {
    const modal = document.getElementById('receiptModal');
    modal.classList.add('hidden');
    modal.classList.remove('flex');
}


// --- 9. COMPLAINTS & MAINTENANCE TICKETING (LANDLORD / CARETAKER) ---
function getTicketStatusBadgeClass(status) {
    if (status === 'Resolved') return 'bg-mpesa-light text-mpesa-dark';
    if (status === 'In Progress') return 'bg-blue-100 text-blue-800';
    return 'bg-amber-100 text-amber-800';
}

function submitTenantComplaint(e) {
    e.preventDefault();
    if (!currentTenant) return;

    const recipient = document.querySelector('input[name="complaintRecipient"]:checked').value;
    const category = document.getElementById('compCategory').value;
    const urgency = document.getElementById('compUrgency').value;
    const subject = document.getElementById('compSubject').value.trim();
    const details = document.getElementById('compDetails').value.trim();

    const ticketId = 'TCK-' + Math.floor(110 + Math.random() * 880);
    const autoAck = recipient.includes('Caretaker')
        ? `Caretaker Mr. Mwangi: Ticket received for ${currentTenant.roomCode}. Will inspect shortly.`
        : `Landlord Management: Logged under ${currentTenant.accountRef}. Admin reviewing within 12 hours.`;

    currentTenant.tickets.unshift({
        id: ticketId,
        recipient,
        category,
        urgency,
        subject,
        details,
        status: 'Open',
        date: 'Just Now',
        reply: autoAck
    });

    e.target.reset();
    saveCampusDatabase();
    renderTenantDashboard();
    showToast('Ticket Dispatched', `${ticketId} sent to ${recipient}.`);
}

function renderComplaintsFeed() {
    if (!currentTenant) return;
    const feed = document.getElementById('tenantTicketsFeed');

    if (currentTenant.tickets.length === 0) {
        feed.innerHTML = `<p class="text-xs text-slate-500 py-6 text-center bg-slate-50 rounded-xl">No tickets submitted yet. Use the form on the left to reach the caretaker or landlord.</p>`;
        return;
    }

    feed.innerHTML = currentTenant.tickets.map(t => `
                    <div class="p-4 rounded-2xl border border-slate-200 bg-slate-50/70 space-y-2 text-xs">
                        <div class="flex flex-wrap items-center justify-between gap-2">
                            <div class="flex items-center gap-2">
                                <span class="font-mono font-bold text-slate-500">${t.id}</span>
                                <span class="font-extrabold text-slate-900">${t.subject}</span>
                            </div>
                            <span class="text-[10px] font-extrabold px-2.5 py-0.5 rounded-full ${getTicketStatusBadgeClass(t.status)}">${t.status}</span>
                        </div>
                        <div class="flex flex-wrap items-center gap-2 text-[11px] text-slate-500">
                            <span>To: <strong class="text-slate-700">${t.recipient}</strong></span>
                            <span>•</span>
                            <span>${t.category} (${t.urgency})</span>
                            <span>•</span>
                            <span>${t.date}</span>
                        </div>
                        <p class="text-slate-600 leading-relaxed">${t.details}</p>
                        ${t.reply ? `
                            <div class="mt-2 p-2.5 rounded-xl bg-white border border-slate-200 text-[11px] text-slate-700">
                                <strong class="text-mpesa-dark">Response:</strong> ${t.reply}
                            </div>
                        ` : ''}
                    </div>
                `).join('');
}

function renderManagementPanel() {
    if (!currentTenant) return;

    document.getElementById('managementUnitCount').textContent = vacantRoomsInventory.length;
    document.getElementById('managementPaymentCount').textContent = currentTenant.receipts.length;
    document.getElementById('managementTicketCount').textContent =
        currentTenant.tickets.filter(ticket => ticket.status !== 'Resolved').length;

    const unitSelect = document.getElementById('managementUnitId');
    const previousId = unitSelect.value;
    unitSelect.innerHTML = vacantRoomsInventory.map(unit =>
        `<option value="${unit.id}">${unit.roomCode} — ${unit.status}</option>`
    ).join('');
    if ([...unitSelect.options].some(option => option.value === previousId)) {
        unitSelect.value = previousId;
    }
    loadManagementUnit();

    document.getElementById('managementTenantName').value = currentTenant.fullName;
    document.getElementById('managementTenantPhone').value = currentTenant.phone;
    document.getElementById('managementAccountBalance').value = currentTenant.balanceDue;
    document.getElementById('managementMeterNumber').value = currentTenant.meterNumber;
    document.getElementById('managementLeaseStatus').value =
        currentTenant.hasActiveRoom ? 'active' : 'pending';

    document.getElementById('managementRecordList').innerHTML =
        `<div class="rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs"><p class="font-bold text-slate-900">${currentTenant.fullName}</p><p class="text-slate-500 mt-1">${currentTenant.accountRef} • ${currentTenant.roomCode}</p><p class="font-mono text-slate-600 mt-1">Balance: KES ${currentTenant.balanceDue.toLocaleString()}</p></div>` +
        currentTenant.receipts.map(receipt =>
            `<div class="rounded-xl border border-slate-200 p-3 text-xs"><div class="flex items-center justify-between"><span class="font-mono font-bold">${receipt.code}</span><span class="font-extrabold text-mpesa-dark">KES ${receipt.amount.toLocaleString()}</span></div><p class="text-slate-500 mt-1">${receipt.description}</p></div>`
        ).join('');

    document.getElementById('managementTicketList').innerHTML =
        currentTenant.tickets.length
            ? currentTenant.tickets.map(ticket => `
                            <div class="rounded-xl border border-slate-200 p-3 text-xs">
                                <div class="flex items-center justify-between gap-2"><span class="font-bold text-slate-900">${ticket.id} — ${ticket.subject}</span><span class="text-[10px] font-extrabold">${ticket.status}</span></div>
                                <select onchange="updateManagementTicketStatus('${ticket.id}', this.value)" class="mt-2 w-full text-xs border border-slate-200 rounded-lg px-2 py-1.5">
                                    ${['Open', 'In Progress', 'Resolved'].map(status => `<option value="${status}" ${ticket.status === status ? 'selected' : ''}>${status}</option>`).join('')}
                                </select>
                            </div>
                        `).join('')
            : '<p class="text-xs text-slate-500 py-4 text-center">No maintenance tickets recorded.</p>';
}

function loadManagementUnit() {
    const unitId = document.getElementById('managementUnitId').value;
    const unit = vacantRoomsInventory.find(item => item.id === unitId);
    if (!unit) return;
    document.getElementById('managementUnitStatus').value =
        unit.status === 'Vacant' ? 'Vacant' : (unit.status === 'Reserved' ? 'Reserved' : 'Booked');
    document.getElementById('managementRoomCode').value = unit.roomCode;
    document.getElementById('managementAccountRef').value = unit.accountRef;
    document.getElementById('managementMonthlyPrice').value = unit.monthlyPrice;
    document.getElementById('managementSemesterPrice').value = unit.semesterPrice;
}

function saveManagementUnit(event) {
    event.preventDefault();
    const unitId = document.getElementById('managementUnitId').value;
    const unit = vacantRoomsInventory.find(item => item.id === unitId);
    if (!unit) return;
    unit.status = document.getElementById('managementUnitStatus').value;
    unit.roomCode = document.getElementById('managementRoomCode').value.trim();
    unit.accountRef = document.getElementById('managementAccountRef').value.trim();
    unit.monthlyPrice = Number(document.getElementById('managementMonthlyPrice').value);
    unit.semesterPrice = Number(document.getElementById('managementSemesterPrice').value);
    saveCampusDatabase();
    renderTenantDashboard();
    renderManagementPanel();
    showToast('Database Updated', `${unit.roomCode} inventory and pricing saved.`);
}

function saveManagementTenant(event) {
    event.preventDefault();
    currentTenant.fullName = document.getElementById('managementTenantName').value.trim();
    currentTenant.phone = document.getElementById('managementTenantPhone').value.trim();
    currentTenant.balanceDue = Number(document.getElementById('managementAccountBalance').value);
    currentTenant.meterNumber = document.getElementById('managementMeterNumber').value.trim();
    currentTenant.hasActiveRoom = document.getElementById('managementLeaseStatus').value === 'active';
    saveCampusDatabase();
    renderTenantDashboard();
    renderManagementPanel();
    showToast('Tenant Database Updated', 'Tenant profile and account balance saved.');
}

function updateManagementTicketStatus(ticketId, status) {
    const ticket = currentTenant.tickets.find(item => item.id === ticketId);
    if (!ticket) return;
    ticket.status = status;
    saveCampusDatabase();
    renderTenantDashboard();
    renderManagementPanel();
    showToast('Ticket Updated', `${ticketId} changed to ${status}.`);
}

function exportCampusDatabase() {
    const database = loadCampusDatabase() || {
        units: vacantRoomsInventory,
        lastTenant: currentTenant,
        updatedAt: new Date().toISOString()
    };
    const blob = new Blob([JSON.stringify(database, null, 2)], { type: 'application/json' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `campusnest-database-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(link.href);
    showToast('Database Exported', 'A JSON backup has been downloaded.');
}

function generateMpesaCode() {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = 'UK';
    for (let i = 0; i < 8; i++) code += chars[Math.floor(Math.random() * chars.length)];
    return code;
}

function formatCurrentKenyaDate() {
    return new Date().toLocaleString('en-KE', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}


// --- 10. MOBILE MENU & TOAST NOTIFICATIONS ---
function toggleMobileMenu() {
    const menu = document.getElementById('mobileMenu');
    menu.classList.toggle('hidden');
}

function showToast(title, message) {
    const container = document.getElementById('toastContainer');
    const toast = document.createElement('div');
    toast.className = 'pointer-events-auto bg-white border-l-4 border-mpesa rounded-xl shadow-xl p-3.5 flex items-start gap-3 transition-all duration-300';
    toast.innerHTML = `
                    <div class="w-7 h-7 rounded-lg bg-mpesa-light text-mpesa flex items-center justify-center shrink-0 mt-0.5 font-bold">✓</div>
                    <div>
                        <p class="text-xs font-bold text-slate-900">${title}</p>
                        <p class="text-xs text-slate-500 mt-0.5">${message}</p>
                    </div>
                `;
    container.appendChild(toast);
    setTimeout(() => {
        toast.style.opacity = '0';
        setTimeout(() => toast.remove(), 300);
    }, 4000);
}


// --- 4. VIEWING SCHEDULER FORM HANDLER ---
function handleViewingSubmit(e) {
    e.preventDefault();
    const name = document.getElementById('viewName').value.trim();
    const unit = document.getElementById('viewUnitType').value;
    const mode = document.getElementById('viewMode').value;

    showToast(
        'Free Viewing Confirmed!',
        `Caretaker Mr. Mwangi has reserved a ${mode} for ${name} (${unit}).`
    );
    e.target.reset();
}


// --- 5. AI HOUSING ASSISTANT CHATBOT ---
let aiChatOpen = false;

function toggleAiChat() {
    aiChatOpen = !aiChatOpen;
    const win = document.getElementById('aiChatWindow');
    if (aiChatOpen) {
        win.classList.remove('hidden');
        document.getElementById('aiChatInput').focus();
    } else {
        win.classList.add('hidden');
    }
}

function openChatWithPrompt(promptText) {
    if (!aiChatOpen) toggleAiChat();
    sendQuickPrompt(promptText);
}

function sendQuickPrompt(text) {
    appendChatMessage('user', text);
    respondWithAiKnowledge(text);
}

function handleChatSubmit(e) {
    e.preventDefault();
    const input = document.getElementById('aiChatInput');
    const text = input.value.trim();
    if (!text) return;
    input.value = '';
    appendChatMessage('user', text);
    respondWithAiKnowledge(text);
}

function appendChatMessage(sender, htmlText) {
    const box = document.getElementById('aiChatMessages');
    const wrapper = document.createElement('div');

    if (sender === 'user') {
        wrapper.className = 'flex justify-end';
        wrapper.innerHTML = `
                        <div class="bg-slate-900 text-white rounded-2xl rounded-tr-none px-3.5 py-2.5 max-w-[82%] shadow-2xs leading-relaxed">
                            ${htmlText}
                        </div>
                    `;
    } else {
        wrapper.className = 'flex items-start gap-2.5';
        wrapper.innerHTML = `
                        <div class="w-7 h-7 rounded-lg bg-mpesa text-white font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">AI</div>
                        <div class="bg-white border border-slate-200 rounded-2xl rounded-tl-none p-3 text-slate-700 max-w-[85%] shadow-2xs leading-relaxed">
                            ${htmlText}
                        </div>
                    `;
    }

    box.appendChild(wrapper);
    box.scrollTop = box.scrollHeight;
}

function respondWithAiKnowledge(query) {
    const q = query.toLowerCase();
    let reply = '';

    if (q.includes('bedsitter') || q.includes('deposit') || q.includes('price') || q.includes('cost') || q.includes('how much')) {
        reply = `Here are our current student unit rates:<br>
                    • <strong>Single Room:</strong> KES 4,500/mo (KES 16,500/sem)<br>
                    • <strong>En-Suite Bedsitter:</strong> KES 8,500/mo (KES 32,000/sem)<br>
                    • <strong>Shared Dual Studio:</strong> KES 6,000/bed/mo<br>
                    • <strong>1-Bedroom:</strong> KES 13,500/mo<br><br>
                    <strong>Move-in Deposit:</strong> Equal to 1 month's rent (100% refundable at checkout) + KES 500 smart-gate card fee. Zero viewing fees!`;
    } else if (q.includes('wifi') || q.includes('wi-fi') || q.includes('water') || q.includes('utilities') || q.includes('token') || q.includes('electricity')) {
        reply = `<strong>Included in Rent (Free):</strong><br>
                    ✅ Unlimited 50Mbps Fiber Wi-Fi on every floor<br>
                    ✅ 24/7 Borehole + County water (50,000L backup tanks)<br>
                    ✅ Twice-weekly garbage collection<br><br>
                    <strong>Electricity:</strong> Each room has its own independent <strong>KPLC prepaid token meter</strong> so you only pay for what you use.`;
    } else if (q.includes('mpesa') || q.includes('m-pesa') || q.includes('parent') || q.includes('paybill') || q.includes('helb')) {
        reply = `Parents, guardians, or students can pay easily via <strong>M-Pesa STK Push</strong> on this website or manually via Paybill:<br>
                    • <strong>Paybill No:</strong> <code>4092184</code><br>
                    • <strong>Account No:</strong> Your Room/Bed Code (e.g., <code>JJA-BED-B4</code>)<br><br>
                    Even when a parent pays from their own phone number, the receipt automatically credits the student's room account!`;
    } else if (q.includes('security') || q.includes('curfew') || q.includes('safe') || q.includes('visitor')) {
        reply = `We have <strong>24/7 uniformed guards</strong>, biometric/smart-card gate access, HD CCTV cameras in all corridors, and an electric perimeter fence.<br><br>
                    <strong>Curfew Policy:</strong> Registered tenants have <strong>24/7 biometric access</strong> (no curfew for late library study!), while visitors sign out at 10:00 PM.`;
    } else if (q.includes('view') || q.includes('visit') || q.includes('location') || q.includes('where') || q.includes('jkuat') || q.includes('ku')) {
        reply = `We are located <strong>5 mins walk (450m)</strong> from <strong>JKUAT Gate C (Juja)</strong> and <strong>300m from KU Kahawa Wendani</strong>.<br><br>
                    You can visit any day between 7:00 AM – 8:00 PM for free, or call our Caretaker Mr. Mwangi on <strong>0712 345 678</strong>.`;
    } else {
        reply = `I can help with <strong>unit prices & deposits</strong>, <strong>Wi-Fi & water utilities</strong>, <strong>24/7 security</strong>, or <strong>M-Pesa booking</strong>. You can also click <em>"Book / Reserve via M-Pesa"</em> on any room card above to test instant reservation!`;
    }

    setTimeout(() => {
        appendChatMessage('ai', reply);
    }, 350);
}


// --- 6. M-PESA BOOKING & PORTAL MODAL LOGIC ---
function openPortalModal(mode) {
    openAuthModal('login', mode === 'ledger' ? 'receipts' : 'overview');
}

// --- INITIALIZE ---
window.addEventListener('DOMContentLoaded', () => {
    renderUnitCards();
    if (window.lucide) lucide.createIcons();
});





document.addEventListener('DOMContentLoaded', () => {
    // Target all buttons carrying the .let-btn configuration 
    const letButtons = document.querySelectorAll('.let-btn');
    const contactPhoneNumber = "0706407311";

    // Establish click monitoring logic across room layout options
    letButtons.forEach(button => {
        button.addEventListener('click', (event) => {
            // Extract custom room metadata from structural attribute configuration
            const roomIdentifier = event.target.getAttribute('data-room');

            // Launch browser alert indicating correct contact method details
            alert(`To check structural vacancy status for Room ${roomIdentifier}, please reach out directly via call: ${contactPhoneNumber}`);
        });
    });
});
