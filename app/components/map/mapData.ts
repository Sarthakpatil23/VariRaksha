/**
 * Wari Route Street-by-Street Real Highway Coordinates (Alandi -> Pune -> Phaltan -> Wakhari -> Pandharpur)
 * Following the official Sant Dnyaneshwar Maharaj Palkhi Marg (NH-965 / SH-148)
 */
import fullRouteData from './wariRealRoute.json';

export interface MapPoint {
  id: string;
  category:
    | 'volunteer'
    | 'medical'
    | 'water'
    | 'food'
    | 'rest'
    | 'toilet'
    | 'religious'
    | 'emergency'
    | 'dindi'
    | 'destination';
  nameMr: string;
  nameHi: string;
  nameEn: string;
  lat: number;
  lng: number;
  distanceMr: string;
  distanceHi: string;
  distanceEn: string;
  walkTimeMr: string;
  walkTimeHi: string;
  walkTimeEn: string;
  statusMr: string;
  statusHi: string;
  statusEn: string;
  descriptionMr: string;
  descriptionHi: string;
  descriptionEn: string;
  servicesMr: string[];
  servicesHi: string[];
  servicesEn: string[];
  phone?: string;
  badgeColor: string;
  iconType: string;
}

// 3,806 high-definition street-by-street highway coordinates
export const WARI_FULL_PALKHI_ROUTE: [number, number][] = fullRouteData as [number, number][];

// Active segment from Phaltan (index 2282) to Pandharpur Temple (index 3806)
export const WARI_ACTIVE_SEGMENT: [number, number][] = WARI_FULL_PALKHI_ROUTE.slice(2282);

// Current Pilgrim Position Details
export const CURRENT_PILGRIM_LOCATION = {
  lat: 17.7120,
  lng: 75.2410,
  landmarkMr: 'वाखरी प्रवेशद्वाराजवळ (दिंडी क्र. १२)',
  landmarkHi: 'वाखरी प्रवेश द्वार के पास (दिंडी सं. १२)',
  landmarkEn: 'Near Wakhari Gate · Dindi #12',
  distanceToDestMr: '१२.५ कि.मी. पंढरपूर बाकी',
  distanceToDestHi: '१२.५ किमी पंढरपुर शेष',
  distanceToDestEn: '12.5 km to Pandharpur Temple',
};

// Points of Interest with Custom Vector Styling along the route
export const MAP_SERVICE_POINTS: MapPoint[] = [
  {
    id: 'med-1',
    category: 'medical',
    nameMr: 'वाखरी फिरते रुग्णालय व प्रथमोपचार केंद्र',
    nameHi: 'वाखरी मोबाइल अस्पताल व प्राथमिक चिकित्सा केंद्र',
    nameEn: 'Wakhari Mobile Clinic & Emergency Care',
    lat: 17.7138,
    lng: 75.2438,
    distanceMr: '३५० मी.',
    distanceHi: '३५० मी.',
    distanceEn: '350 m',
    walkTimeMr: '५ मिनिटे चालणे',
    walkTimeHi: '५ मिनट पैदल',
    walkTimeEn: '5 min walk',
    statusMr: '🟢 २४ तास सुरू · डॉक्टर व रुग्णवाहिका उपलब्ध',
    statusHi: '🟢 २४ घंटे खुला · डॉक्टर व एम्बुलेंस उपलब्ध',
    statusEn: '🟢 Open 24/7 · Doctor & Ambulance on Duty',
    descriptionMr: 'मोफत औषधोपचार, बीपी/शुगर तपासणी, डिहायड्रेशन ओआरएस व आपत्कालीन प्रथमोपचार कक्ष.',
    descriptionHi: 'निःशुल्क दवाएं, बीपी जांच, ओआरएस घोल और आपातकालीन प्राथमिक चिकित्सा।',
    descriptionEn: 'Free doctor consultation, blood pressure checks, ORS hydration & emergency trauma care.',
    servicesMr: ['डॉक्टर ऑन ड्युटी', 'बीपी / शुगर तपासणी', 'ओआरएस व औषधे', 'रुग्णवाहिका'],
    servicesHi: ['डॉक्टर उपस्थित', 'बीपी जांच', 'दवा वितरण', 'एम्बुलेंस'],
    servicesEn: ['Doctor on Duty', 'BP & Sugar Check', 'Free Medicines & ORS', 'Ambulance Standby'],
    phone: '+91 98230 44556',
    badgeColor: '#D32F2F',
    iconType: 'medical',
  },
  {
    id: 'wat-1',
    category: 'water',
    nameMr: 'ज्ञानेश्वर माऊली शुद्ध पाणी टँकर क्र. ४',
    nameHi: 'ज्ञानेश्वर माऊली शुद्ध जल टैंकर सं. ४',
    nameEn: 'Mauli Pure Water Tanker #4',
    lat: 17.7112,
    lng: 75.2395,
    distanceMr: '१५० मी.',
    distanceHi: '१५० मी.',
    distanceEn: '150 m',
    walkTimeMr: '२ मिनिटे चालणे',
    walkTimeHi: '२ मिनट पैदल',
    walkTimeEn: '2 min walk',
    statusMr: '🟢 थंड व शुद्ध आरओ पिण्याचे पाणी उपलब्ध',
    statusHi: '🟢 शीतल व शुद्ध आरओ पेयजल उपलब्ध',
    statusEn: '🟢 Cold RO Purified Drinking Water Active',
    descriptionMr: 'वारकऱ्यांसाठी मोफत थंड पिण्याचे पाणी व बाटली रिफिलिंग व्यवस्था (१० नळ कार्यरत).',
    descriptionHi: 'श्रद्धालुओं के लिए निःशुल्क ठंडा पीने का पानी और बोतल रीफिलिंग काउंटर।',
    descriptionEn: 'Free cold purified drinking water with 10 high-flow bottle refill taps.',
    servicesMr: ['थंड आरओ पाणी', 'जलद बाटली रिफिल', '१० नळ सोय'],
    servicesHi: ['शीतल आरओ जल', 'बोतल रीफिल', '१० नल'],
    servicesEn: ['Cold RO Water', 'Quick Bottle Refill', '10 Dispenser Taps'],
    badgeColor: '#0288D1',
    iconType: 'water',
  },
  {
    id: 'food-1',
    category: 'food',
    nameMr: 'श्री विठ्ठल कृपा महाप्रसाद अन्नछत्र',
    nameHi: 'श्री विट्ठल कृपा महाप्रसाद अन्नछत्र',
    nameEn: 'Shree Vitthal Mahaprasad Annachhatra',
    lat: 17.7092,
    lng: 75.2442,
    distanceMr: '४०० मी.',
    distanceHi: '४०० मी.',
    distanceEn: '400 m',
    walkTimeMr: '६ मिनिटे चालणे',
    walkTimeHi: '६ मिनट पैदल',
    walkTimeEn: '6 min walk',
    statusMr: '🟢 दुपारचे जेवण सुरू (११:३० ते ३:००)',
    statusHi: '🟢 दोपहर का भोजन चालू (११:३० से ३:००)',
    statusEn: '🟢 Lunch Serving Now (11:30 AM - 3:00 PM)',
    descriptionMr: 'गरमागरम पिठलं-भाकरी, ठेचा, मुगडाळ खिचडी, वरण-भात आणि थंडगार ताक (छास) महाप्रसाद.',
    descriptionHi: 'गरमागरम पिठला-भाकरी, ठेचा, मूंग दाल खिचड़ी, दाल-चावल और ठंडा छाछ।',
    descriptionEn: 'Hot Zunka Bhakri, Green Thecha, Dal Khichdi, Rice and cold spiced buttermilk.',
    servicesMr: ['महाप्रसाद भोजन', 'ताक वाटप', 'सावलीत आसन व्यवस्था'],
    servicesHi: ['महाप्रसाद भोजन', 'छाछ वितरण', 'छायादार बैठक'],
    servicesEn: ['Mahaprasad Lunch', 'Fresh Buttermilk', 'Shaded Dining Hall'],
    badgeColor: '#E65100',
    iconType: 'food',
  },
  {
    id: 'vol-1',
    category: 'volunteer',
    nameMr: 'वारीरक्षा स्वयंसेवक मदत केंद्र #१२',
    nameHi: 'वारीरक्षा स्वयंसेवक सहायता केंद्र #१२',
    nameEn: 'VariRaksha Volunteer Help Desk #12',
    lat: 17.7145,
    lng: 75.2375,
    distanceMr: '२२० मी.',
    distanceHi: '२२० मी.',
    distanceEn: '220 m',
    walkTimeMr: '३ मिनिटे चालणे',
    walkTimeHi: '३ मिनट पैदल',
    walkTimeEn: '3 min walk',
    statusMr: '🟢 स्वयंसेवक गणेश शिंदे व टीम हजर',
    statusHi: '🟢 स्वयंसेवक गणेश शिंदे व टीम उपस्थित',
    statusEn: '🟢 Volunteer Ganesh Shinde & Team Active',
    descriptionMr: 'हरवलेल्या वारकऱ्यांना शोधणे, दिंडी समन्वय, फोन चार्जिंग मदत व मार्ग दिशादर्शन.',
    descriptionHi: 'खोए-पाए यात्रियों की मदद, दिंडी समन्वय, फोन चार्जिंग और मार्गदर्शन।',
    descriptionEn: 'Assistance for separated pilgrims, Dindi route guidance & emergency dispatch.',
    servicesMr: ['दिंडी समन्वय', 'हरवलेले शोध केंद्र', 'तातडीचा फोन'],
    servicesHi: ['दिंडी समन्वय', 'खोया-पाया डेस्क', 'कॉल सहायता'],
    servicesEn: ['Dindi Coordination', 'Lost Person Desk', 'Emergency Hot-line'],
    phone: '+91 98900 11223',
    badgeColor: '#7B1FA2',
    iconType: 'volunteer',
  },
  {
    id: 'rest-1',
    category: 'rest',
    nameMr: 'दिंडी क्र. १२ विश्रांती मंडप व छावणी',
    nameHi: 'दिंडी सं. १२ विश्राम पंडाल व छावनी',
    nameEn: 'Dindi #12 Rest Tent & Canopy',
    lat: 17.7165,
    lng: 75.2418,
    distanceMr: '५०० मी.',
    distanceHi: '५०० मी.',
    distanceEn: '500 m',
    walkTimeMr: '७ मिनिटे चालणे',
    walkTimeHi: '७ मिनट पैदल',
    walkTimeEn: '7 min walk',
    statusMr: '🟢 सावली, कुलर व मॅट्सची सोय',
    statusHi: '🟢 छाया, कूलर और गद्दे उपलब्ध',
    statusEn: '🟢 Shaded Tent, Air Coolers & Mats Ready',
    descriptionMr: 'दिंडी १२ च्या वारकऱ्यांसाठी विश्रांती, पंखे, कुलर, मोबाईल चार्जिंग व रात्रीचा मुक्काम.',
    descriptionHi: 'दिंडी १२ के श्रद्धालुओं के लिए आराम, पंखे, कूलर, मोबाइल चार्जिंग की व्यवस्था।',
    descriptionEn: 'Rest canopy for Dindi #12 pilgrims with sleeping mats, coolers and mobile charging.',
    servicesMr: ['विश्रांती मॅट्स', 'मोबाईल चार्जिंग', 'पंखे / कुलर', 'सावली'],
    servicesHi: ['विश्राम चटाई', 'मोबाइल चार्जिंग', 'कूलर', 'छाया'],
    servicesEn: ['Resting Mats', 'Mobile Charging Points', 'Air Coolers', 'Large Canopy'],
    badgeColor: '#2E7D32',
    iconType: 'rest',
  },
  {
    id: 'toilet-1',
    category: 'toilet',
    nameMr: 'फिरती पर्यावरणपूरक स्वच्छतागृहे (Bio-Toilets)',
    nameHi: 'मोबाइल बायो-टॉयलेट्स संकुल',
    nameEn: 'Mobile Bio-Toilet & Sanitation Cluster',
    lat: 17.7098,
    lng: 75.2365,
    distanceMr: '२८० मी.',
    distanceHi: '२८० मी.',
    distanceEn: '280 m',
    walkTimeMr: '४ मिनिटे चालणे',
    walkTimeHi: '४ मिनट पैदल',
    walkTimeEn: '4 min walk',
    statusMr: '🟢 महिला व पुरुषांसाठी स्वतंत्र · स्वच्छ',
    statusHi: '🟢 महिला और पुरुषों के लिए अलग · स्वच्छ',
    statusEn: '🟢 Cleaned Hourly · Separate for Women & Men',
    descriptionMr: 'महिला व पुरुषांसाठी स्वतंत्र १५ फिरती स्वच्छतागृहे, हात धुण्याचे पाणी व सॅनिटायझर.',
    descriptionHi: 'महिला और पुरुषों के लिए अलग १५ मोबाइल शौचालय, नल का पानी और सैनिटाइजर।',
    descriptionEn: '15 mobile bio-toilets with running water, soap dispensers & separate female units.',
    servicesMr: ['महिला स्वच्छतागृह', 'पुरुष स्वच्छतागृह', 'हात धुण्याचे पाणी'],
    servicesHi: ['महिला शौचालय', 'पुरुष शौचालय', 'हैंडवॉश'],
    servicesEn: ['Women Section', 'Men Section', 'Handwash Running Water'],
    badgeColor: '#00796B',
    iconType: 'toilet',
  },
  {
    id: 'rel-1',
    category: 'religious',
    nameMr: 'वाखरी रिंगण मैदान (पवित्र गोल रिंगण)',
    nameHi: 'वाखरी रिंगण मैदान (पवित्र गोल रिंगण समारोह)',
    nameEn: 'Wakhari Ringan Maidan (Holy Horse Run)',
    lat: 17.7050,
    lng: 75.2480,
    distanceMr: '९०० मी.',
    distanceHi: '९०० मी.',
    distanceEn: '900 m',
    walkTimeMr: '१२ मिनिटे चालणे',
    walkTimeHi: '१२ मिनट पैदल',
    walkTimeEn: '12 min walk',
    statusMr: '🚩 आज दुपारी ३:४५ वाजता रिंगण सोहळा',
    statusHi: '🚩 आज दोपहर ३:४५ बजे रिंगण समारोह',
    statusEn: '🚩 Sacred Ringan Ceremony Today at 3:45 PM',
    descriptionMr: 'माऊलींच्या अश्वांची नयनरम्य गोल दौड, टाळ-मृदुंगाचा गजर आणि पताका नाचवण्याचा सोहळा.',
    descriptionHi: 'माऊली के पवित्र घोड़ों का भव्य गोल रिंगण और भजन-कीर्तन सोहळा।',
    descriptionEn: 'The grand Ringan spectacle with holy horse sprint, flag dances and live bhajan kirtan.',
    servicesMr: ['रिंगण सोहळा', 'प्रेक्षक गॅलरी', 'सुरक्षा व्यवस्था'],
    servicesHi: ['रिंगण समारोह', 'दर्शक दीर्घा', 'सुरक्षा'],
    servicesEn: ['Sacred Horse Run', 'Viewing Gallery', 'Safety Barrier'],
    badgeColor: '#C2185B',
    iconType: 'religious',
  },
  {
    id: 'dest',
    category: 'destination',
    nameMr: 'श्री विठ्ठल रुक्मिणी मंदिर, पंढरपूर (अंतिम ध्येय)',
    nameHi: 'श्री विट्ठल रुक्मिणी मंदिर, पंढरपुर (अंतिम गंतव्य)',
    nameEn: 'Shree Vitthal Temple, Pandharpur (Destination)',
    lat: 17.6775,
    lng: 75.3267,
    distanceMr: '१२.५ कि.मी.',
    distanceHi: '१२.५ किमी',
    distanceEn: '12.5 km',
    walkTimeMr: 'अंदाजे ३.५ तास',
    walkTimeHi: 'लगभग ३.५ घंटे',
    walkTimeEn: '~3.5 hrs walk',
    statusMr: '🚩 पवित्र चंद्रभागा स्नान व श्री विठ्ठल दर्शन',
    statusHi: '🚩 पवित्र चंद्रभागा स्नान व श्री विट्ठल दर्शन',
    statusEn: '🚩 Final Goal of Holy Wari Pilgrimage',
    descriptionMr: 'पवित्र चंद्रभागेचे स्नान आणि युगे अठ्ठावीस विटेवर उभ्या असलेल्या विठू माऊलींचे दर्शन.',
    descriptionHi: 'पवित्र चंद्रभागा नदी में स्नान और पांडुरंग के दर्शन के साथ यात्रा पूर्ण।',
    descriptionEn: 'Holy bath in sacred Chandrabhaga river followed by Darshan of Lord Vitthal.',
    servicesMr: ['मुख दर्शन', 'पदस्पर्श दर्शन', 'चंद्रभागा स्नान घाट', 'महाप्रसाद'],
    servicesHi: ['मुख दर्शन', 'चरण दर्शन', 'स्नान घाट', 'महाप्रसाद'],
    servicesEn: ['Mukh Darshan', 'Padsparsh Darshan', 'Bathing Ghat', 'Grand Mahaprasad'],
    badgeColor: '#5D001E',
    iconType: 'destination',
  },
];
