/**
 * VariRaksha RAG Global Knowledge Base & Semantic Retrieval Engine
 * 
 * Provides curated, authoritative, multi-lingual knowledge chunks across:
 * 1. Pilgrim Routes & Logistics (Dehu, Alandi, Saswad, Phaltan, Malshiras, Wakhari, Pandharpur)
 * 2. Pilgrimage First Aid & Common Health (blisters, hydration, cramps, heat exhaustion, ORS)
 * 3. Chronic Condition Management (diabetes, hypertension, asthma, cardiac precautions on march)
 * 4. Emergency Protocols (chest pain, stroke FAST, severe breathlessness, fainting, anaphylaxis)
 * 5. VariRaksha App Guidance (Emergency ID, SOS, contacting dindi leader, medical camps)
 */

export interface KnowledgeDocument {
  id: string;
  category: 'route_logistics' | 'first_aid' | 'chronic_care' | 'emergency_protocol' | 'app_guidance';
  title: string;
  keywords: string[];
  content_mr: string;
  content_hi: string;
  content_en: string;
  severityDefault?: 'low' | 'moderate' | 'emergency';
}

export const GLOBAL_KNOWLEDGE_BASE: KnowledgeDocument[] = [
  // ===================== 1. ROUTE & LOGISTICS =====================
  {
    id: 'route-water-ors',
    category: 'route_logistics',
    title: 'Water Points and ORS Distribution on Palkhi Marg',
    keywords: [
      'water', 'pani', 'paani', 'ors', 'drinking', 'thirst', 'tahan', 'paani kothe ahe',
      'पाणी', 'पाण्याचे थांबे', 'ओआरएस', 'तहान', 'पिण्याचे पाणी', 'जल', 'पानी'
    ],
    content_mr: 'पालखी मार्गावर दर १ ते २ किलोमीटरवर शासकीय व स्वयंसेवी संस्थांचे मोफत शुद्ध पिण्याचे पाणी आणि ओआरएस (ORS) वाटप केंद्रे उपलब्ध आहेत. फलटण, वाखरी, सासवड आणि लोणंद या मुख्य थांब्यांवर सतत थंड व स्वच्छ पाणी टँकर्स सज्ज असतात. वारकऱ्यांनी दर तासाला किमान २००-३०० मिली पाणी किंवा ओआरएस घ्यावे.',
    content_hi: 'पालकी मार्ग पर हर १ से २ किलोमीटर पर मुफ्त शुद्ध पेयजल और ओआरएस (ORS) वितरण केंद्र उपलब्ध हैं। फलटण, वाखरी, सासवड और लोणंद के मुख्य पड़ावों पर पानी के टैंकर लगातार तैनात हैं। पदयात्रियों को हर घंटे कम से कम २००-३०० मिली पानी या ओआरएस पीना चाहिए।',
    content_en: 'Along the Palkhi route, free clean drinking water and ORS kiosks are available every 1 to 2 km run by government and volunteer trusts. Dedicated water tankers operate at major halts like Phaltan, Wakhari, Saswad, and Lonand. Pilgrims should drink 200-300 ml of water or ORS every hour.',
    severityDefault: 'low',
  },
  {
    id: 'route-annachhatra-meals',
    category: 'route_logistics',
    title: 'Annachhatra and Meal Timings on Palkhi Route',
    keywords: [
      'food', 'meal', 'lunch', 'dinner', 'annachhatra', 'jevan', 'prasad', 'bhajan', 'breakfast',
      'जेवण', 'अन्नछत्र', 'प्रसाद', 'दुपारचे जेवण', 'रात्रीचे जेवण', 'नाश्ता', 'भोजन', 'खाना'
    ],
    content_mr: 'दुपारचे अन्नछत्र सकाळी ११:३० ते दुपारी २:३० दरम्यान आणि रात्रीचे अन्नछत्र संध्याकाळी ७:०० ते रात्री ९:३० दरम्यान सुरू असते. प्रमुख अन्नछत्र मंडप फलटण आश्रम, वाखरी तळ, सासवड आणि भंडीशेगाव येथे आहेत. नेहमी ताजे आणि हलके अन्न ग्रहण करावे.',
    content_hi: 'दोपहर का अन्नछत्र सुबह ११:३० से दोपहर २:३० बजे तक और रात का अन्नछत्र शाम ७:०० से रात ९:३० बजे तक चालू रहता है। मुख्य अन्नछत्र फलटण आश्रम, वाखरी मैदान, सासवड और भंडीशेगाव में स्थित हैं। हमेशा ताजा और सुपाच्य भोजन करें।',
    content_en: 'Afternoon Annachhatra (meal distribution) operates from 11:30 AM to 2:30 PM, and dinner runs from 7:00 PM to 9:30 PM at major halt grounds such as Phaltan Ashram, Wakhari Grounds, Saswad, and Bhandishegaon. Eat fresh, easily digestible meals.',
    severityDefault: 'low',
  },
  {
    id: 'route-palkhi-distance-schedule',
    category: 'route_logistics',
    title: 'Palkhi March Route and Next Rest Locations',
    keywords: [
      'route', 'distance', 'phaltan', 'pandharpur', 'visawa', 'halt', 'mukkam', 'marg', 'antar',
      'मार्ग', 'अंतर', 'मुक्काम', 'पुढील मुक्काम', 'विसावा', 'फलटण', 'पंढरपूर', 'वाखरी', 'रास्ता', 'दूरी'
    ],
    content_mr: 'पालखी मार्ग देहू/आळंदी ते पंढरपूर असा अंदाजे २५० किमीचा प्रवास आहे. मुख्य टप्पे: सासवड ➔ जेजुरी ➔ लोणंद ➔ तरडगाव ➔ फलटण ➔ बरड ➔ नातेपुते ➔ माळशिरस ➔ वेळापूर ➔ भंडीशेगाव ➔ वाखरी ➔ पंढरपूर. विसावा ठिकाणी वैद्यकीय तंबू व विश्रांती कक्ष असतात.',
    content_hi: 'पालकी मार्ग देहू/आलंदी से पंढरपुर लगभग २५० किमी की यात्रा है। मुख्य पड़ाव: सासवड ➔ जेजुरी ➔ लोणंद ➔ फलटण ➔ नातेपुते ➔ माळशिरस ➔ वेळापूर ➔ वाखरी ➔ पंढरपुर। प्रत्येक पड़ाव पर चिकित्सा शिविर व विश्राम कक्ष उपलब्ध हैं।',
    content_en: 'The Palkhi pilgrimage spans approximately 250 km from Dehu/Alandi to Pandharpur. Major sectors: Saswad ➔ Jejuri ➔ Lonand ➔ Phaltan ➔ Natepute ➔ Malshiras ➔ Velapur ➔ Wakhari ➔ Pandharpur. Every official halt features resting areas and medical tents.',
    severityDefault: 'low',
  },

  // ===================== 2. FIRST AID & COMMON PILGRIMAGE HEALTH =====================
  {
    id: 'first-aid-foot-blisters',
    category: 'first_aid',
    title: 'Foot Blisters and Soreness Care (पायातील फोड व वेदना)',
    keywords: [
      'blister', 'foot', 'feet', 'pain', 'legs', 'sole', 'sore', 'phod', 'pay', 'chappal',
      'पाय', 'पायाचे फोड', 'फोड', 'पायाला फोड', 'पादत्राणे', 'पायात गोळे', 'पाय दुखणे', 'पैरों में छाले', 'दर्द'
    ],
    content_mr: 'दीर्घ चालण्यामुळे पायात फोड आल्यास ते स्वतः फोडू नका (संसर्ग टाळा). पाय स्वच्छ कोमट पाण्याने धुवून कोरडे करा, मऊ सुती मोजे वापरा, आणि पायाखाली उशी ठेवून १०-१५ मिनिटे पाय वर करून विश्रांती घ्या. प्रत्येक मुक्कामावर वारीरक्षक वैद्यकीय मदत केंद्रात मोफत अँटीसेप्टिक मलम व बँडेज उपलब्ध आहे.',
    content_hi: 'लगातार चलने से पैरों में छाले हो जाएं तो उन्हें कभी न फोड़ें। पैरों को साफ पानी से धोकर सुखाएं, ढीले सूती मोज़े पहनें और पैर थोड़ा ऊपर उठाकर आराम करें। मार्ग में स्थित चिकित्सा केंद्रों पर निःशुल्क एंटीसेप्टिक मरहम और पट्टी उपलब्ध है।',
    content_en: 'Do not pop blisters yourself to prevent infection. Wash feet with clean water, dry gently, wear soft cotton socks, and elevate feet for 10-15 minutes while resting. Free antiseptic ointment and protective bandages are available at route medical booths.',
    severityDefault: 'low',
  },
  {
    id: 'first-aid-muscle-cramps-fatigue',
    category: 'first_aid',
    title: 'Muscle Cramps and Leg Fatigue (गोळे येणे व स्नायू दुखणे)',
    keywords: [
      'cramp', 'muscle', 'leg pain', 'calf', 'thigh', 'tired', 'gole', 'thakva', 'strain',
      'गोळे येणे', 'स्नायू दुखणे', 'पिंढऱ्या', 'थकवा', 'कळा', 'नसा दुखणे', 'मांसपेशियों में ऐंठन', 'थकान'
    ],
    content_mr: 'पिंढऱ्यांमध्ये किंवा पायात गोळे येणे हे शरीरातील पाणी व क्षारांच्या (इलेक्ट्रोलाइट्स) कमतरतेमुळे होते. ताबडतोब सावलीत बसा, हळुवार स्ट्रेचिंग करा आणि ओआरएस (ORS) किंवा लिंबू-पाणी प्या. स्नायूंवर जोर देऊ नका. त्रास कायम राहिल्यास वैद्यकीय मदत कक्षात मसाज व ओआरएस घ्या.',
    content_hi: 'पैरों की मांसपेशियों में ऐंठन (क्रैम्प) शरीर में पानी और नमक की कमी से होती है। तुरंत छाया में बैठें, हल्के हाथ से पैर सीधा करें और ओआरएस या नींबू-पानी पिएं। यदि आराम न मिले तो नजदीकी चिकित्सा शिविर में संपर्क करें।',
    content_en: 'Leg muscle cramps are usually caused by dehydration and electrolyte loss during walking. Rest in shade, gently stretch the calf muscle upward, and drink ORS or electrolyte water. Visit the nearest medical tent if cramps persist.',
    severityDefault: 'low',
  },
  {
    id: 'first-aid-heat-exhaustion-sun',
    category: 'first_aid',
    title: 'Heat Exhaustion and Sun Protection (उन्हाचा त्रास व चक्कर)',
    keywords: [
      'heat', 'sun', 'sunstroke', 'exhaustion', 'unh', 'chakkar', 'sweating', 'garmi',
      'ऊन', 'उन्हाचा त्रास', 'चक्कर', 'घाम', 'उष्माघात', 'तपमान', 'गर्मी', 'धूप', 'लू'
    ],
    content_mr: 'तीव्र उन्हात चालताना टोपी किंवा पांढरा रुमाल डोक्यावर ठेवा. चक्कर, जास्त घाम येणे किंवा थकवा जाणवल्यास त्वरित सावलीत विश्रांती घ्या, मान व चेहऱ्यावर गार पाण्याचे फडके ठेवा आणि थोडे-थोडे पाणी प्या. ताप किंवा उलट्या सुरू झाल्यास लगेच जवळच्या वारीरक्षक डॉक्टरशी संपर्क साधा.',
    content_hi: 'कड़क धूप में सिर पर टोपी या सफेद गमछा रखें। चक्कर, बहुत ज्यादा पसीना या कमजोरी महसूस होने पर तुरंत छांव में बैठें, चेहरे व गर्दन पर ठंडा पानी लगाएं और घूंट-घूंट पानी पिएं। बुखार या उल्टी होने पर डॉक्टर को दिखाएं।',
    content_en: 'Keep your head covered with a cap or cloth under direct sun. If feeling dizzy, excessively sweating, or weak, move to shade immediately, apply cool wet cloth to neck/forehead, and sip water with electrolytes. Consult route doctors if fever or vomiting develops.',
    severityDefault: 'moderate',
  },
  {
    id: 'first-aid-indigestion-dehydration',
    category: 'first_aid',
    title: 'Mild Stomach Upset, Vomiting, and Dehydration (पोटदुखी व जुलाब)',
    keywords: [
      'stomach', 'vomiting', 'diarrhea', 'nausea', 'pot', 'dast', 'ulati', 'dehydration',
      'पोटदुखी', 'उलटी', 'जुलाब', 'मळमळ', 'अजीर्ण', 'पोट बिघडणे', 'पेट दर्द', 'दस्त'
    ],
    content_mr: 'पोट बिघडल्यास किंवा मळमळ जाणवल्यास तेलकट अन्न टाळा. ताक, लिंबू पाणी, भाताची पेज किंवा ओआरएस प्या. १-२ पेक्षा जास्त उलट्या किंवा वारंवार जुलाब झाल्यास डिहायड्रेशन टाळण्यासाठी त्वरित मार्गावरील वैद्यकीय पथकाकडून तपासणी करून घ्या.',
    content_hi: 'पेट खराब या उल्टी-दस्त होने पर तला हुआ खाना बिल्कुल न खाएं। छाछ, ओआरएस या चावल का पानी पिएं। बार-बार उल्टी या दस्त होने पर तुरंत रास्ते के मेडिकल कैंप से दवा लें।',
    content_en: 'For mild stomach upset, avoid oily foods. Drink buttermilk, rice water, or ORS. If vomiting or diarrhea recurs more than twice, seek prompt evaluation at the nearest route medical post to prevent dehydration.',
    severityDefault: 'moderate',
  },

  // ===================== 3. CHRONIC CONDITION MANAGEMENT ON THE MARCH =====================
  {
    id: 'chronic-diabetes-hypoglycemia',
    category: 'chronic_care',
    title: 'Diabetes and Low Blood Sugar (Hypoglycemia) on Pilgrimage (मधुमेह)',
    keywords: [
      'diabetes', 'sugar', 'hypoglycemia', 'shaky', 'shivering', 'weakness', 'madhumeh', 'fasting', 'upvas',
      'मधुमेह', 'डायबेटीस', 'साखर कमी', 'थरथर', 'उपवास', 'कमजोरी', 'चक्कर आणि घाम', 'डायबिटीज'
    ],
    content_mr: 'मधुमेही वारकऱ्यांनी चालताना अचानक हात थरथरणे, थंड घाम येणे, तीव्र भूक किंवा अंधारी येणे (साखर कमी होणे/Hypoglycemia) याकडे तात्काळ लक्ष द्यावे. ताबडतोब बसावे आणि सोबत ठेवलेला गूळ, साखर, पेढा किंवा गोड बिस्किटे खावीत. वारीत कठोर उपवास करू नये आणि नियमित औषधे वेळेवर घ्यावीत.',
    content_hi: 'डायबिटीज वाले भक्त यदि हाथ कांपना, अचानक पसीना आना, ज्यादा भूख या चक्कर महसूस करें (शुगर कम होना), तो तुरंत बैठें और गुड़, चीनी, फल या मीठा बिस्कुट खाएं। पदयात्रा में कड़ा उपवास न करें और समय पर दवाएं लें।',
    content_en: 'For diabetic pilgrims, sudden shakiness, cold sweats, extreme hunger, or weakness indicate low blood sugar (hypoglycemia). Stop walking immediately, sit safely, and consume quick-acting sugar like jaggery, glucose, sweets, or juice. Avoid severe fasting and take medications on schedule.',
    severityDefault: 'moderate',
  },
  {
    id: 'chronic-hypertension-bp',
    category: 'chronic_care',
    title: 'High Blood Pressure Management (रक्तदाब / हाय बीपी)',
    keywords: [
      'bp', 'hypertension', 'blood pressure', 'headache', 'giddiness', 'raktadab', 'doke',
      'रक्तदाब', 'हाय बीपी', 'डोकेदुखी', 'चक्कर', 'बीपी गोळ्या', 'रक्तचाप'
    ],
    content_mr: 'रक्तदाबाचा त्रास असलेल्या वारकऱ्यांनी दररोजची बीपीची औषधे न चुकता सकाळी घ्यावीत. तीव्र डोकेदुखी, चक्कर किंवा डोळ्यांसमोर अंधारी आल्यास चालणे थांबवून विश्रांती घ्या. प्रत्येक विसावा केंद्रावर वारीरक्षक मोबाईल क्लिनिकमध्ये बीपी तपासणीची मोफत सोय आहे.',
    content_hi: 'हाई बीपी के मरीज अपनी नियमित दवाएं समय पर लें। तेज सिरदर्द या चक्कर आने पर चलना रोककर आराम करें। प्रत्येक पड़ाव पर वारीरक्षक मोबाइल क्लिनिक में मुफ्त बीपी जांच उपलब्ध है।',
    content_en: 'Pilgrims with hypertension must take their prescribed BP medications daily without skipping. If experiencing severe headache or giddiness, stop walking and rest in shade. Free BP monitoring is available at all route medical units.',
    severityDefault: 'moderate',
  },
  {
    id: 'chronic-asthma-respiratory',
    category: 'chronic_care',
    title: 'Asthma, Dust Exposure, and Breathlessness (दमा व श्वसन)',
    keywords: [
      'asthma', 'breath', 'inhaler', 'dust', 'dhul', 'cough', 'dama', 'shwas', 'wheezing',
      'दमा', 'अस्थमा', 'श्वास', 'धुळ', 'खोकला', 'दम लागणे', 'इन्हेलर', 'सांस फूलना'
    ],
    content_mr: 'कच्च्या रस्त्यांवरील धुळीमुळे दम्याचा त्रास उद्भवू शकतो. तोंडावर सुती रुमाल किंवा मास्क बांधा. तुमचा इन्हेलर (Inhaler) नेहमी खिशात किंवा सहज हाती येईल अशा जागी ठेवा. चालताना दम लागल्यास वेग कमी करा व सावलीत बसा. तीव्र श्वास अडकल्यास लगेच वैद्यकीय मदत घ्या.',
    content_hi: 'कच्चे रास्तों की धूल से दमा बढ़ सकता है। मुंह पर रुमाल या मास्क रखें और अपना इनहेलर हमेशा साथ रखें। सांस फूलने पर रुकें और आराम से बैठें।',
    content_en: 'Road dust can trigger asthma flare-ups. Wear a cotton cloth mask and keep your prescribed inhaler easily accessible. Slow down your walking pace if shortness of breath occurs.',
    severityDefault: 'moderate',
  },

  // ===================== 4. EMERGENCY PROTOCOLS (LEVEL 3) =====================
  {
    id: 'emergency-chest-pain-cardiac',
    category: 'emergency_protocol',
    title: 'Chest Pain and Suspected Heart Attack (छातीत तीव्र वेदना / हृदयविकार)',
    keywords: [
      'chest pain', 'heart', 'attack', 'cardiac', 'chhati', 'left arm', 'chhatit dukhne', 'heart attack',
      'छातीत दुखणे', 'छातीत कळ', 'हार्ट अटॅक', 'हृदयरोग', 'छातीत दाब', 'डावा हात', 'सीने में दर्द', 'दौरा'
    ],
    content_mr: '⚠️ आपत्कालीन इशारा: छातीत तीव्र दाब, जडपणा, छातीतून डाव्या हाताकडे किंवा जबड्याकडे जाणारी कळ, श्वास घेण्यास अडचण किंवा थंड घाम येत असल्यास हा संभाव्य हृदयविकाराचा झटका असू शकतो. वारकऱ्याला त्वरित खाली बसवा, हालचाल थांबवा आणि ताबडतोब वारीरक्षक लाल SOS बटण दाबा किंवा १०८ रुग्णवाहिकेला कॉल करा.',
    content_hi: '⚠️ आपातकालीन चेतावनी: सीने में भारीपन, तेज दर्द, दर्द का बाएं हाथ या जबड़े तक फैलना, सांस लेने में तकलीफ या ठंडा पसीना आना दिल के दौरे (Heart Attack) का संकेत हो सकता है। मरीज को तुरंत बैठाएं और तुरंत लाल SOS बटन दबाएं अथवा १०८ एम्बुलेंस को कॉल करें।',
    content_en: '⚠️ EMERGENCY ALERT: Severe chest pressure, squeezing pain radiating to left arm/jaw, severe shortness of breath, or cold sweating can indicate a heart attack. Sit the person down immediately, do not allow walking, and press the red SOS button immediately or call 108 ambulance.',
    severityDefault: 'emergency',
  },
  {
    id: 'emergency-stroke-paralysis',
    category: 'emergency_protocol',
    title: 'Signs of Stroke / Brain Attack - FAST Protocol (पक्षाघात / लकवा)',
    keywords: [
      'stroke', 'paralysis', 'face drop', 'speech slurred', 'arm weak', 'lakwa', 'pakshaghat',
      'पक्षाघात', 'लकवा', 'तोंड वाकडे', 'हात लुळा', 'बोलताना अडखळणे', 'स्ट्रोक'
    ],
    content_mr: '⚠️ आपत्कालीन इशारा: अचानक चेहरा एका बाजूला वाकडा होणे, एका हातामध्ये किंवा पायात अशक्तपणा येणे, किंवा बोलताना जीभ अडखळणे (FAST लक्षणे) हा स्ट्रोक असू शकतो. वेळ अत्यंत मोलाची आहे. ताबडतोब वारीरक्षक SOS बटन दाबा आणि त्वरित अतिदक्षता रुग्णवाहिका मागवा.',
    content_hi: '⚠️ आपातकालीन चेतावनी: अचानक चेहरा टेढ़ा होना, एक हाथ-पैर में कमजोरी आना या बोली लड़खड़ाना स्ट्रोक (लकवा) के लक्षण हैं। तुरंत वारीरक्षक SOS बटन दबाएं और आपातकालीन एम्बुलेंस बुलाएं।',
    content_en: '⚠️ EMERGENCY ALERT: Sudden facial droop, arm weakness, or slurred speech are key signs of a stroke (FAST). Time is critical. Press the SOS button immediately for emergency ambulance dispatch.',
    severityDefault: 'emergency',
  },
  {
    id: 'emergency-severe-breathing-anaphylaxis',
    category: 'emergency_protocol',
    title: 'Severe Respiratory Distress & Allergic Anaphylaxis (तीव्र श्वासरोध व ॲलर्जी)',
    keywords: [
      'severe breathing', 'choking', 'anaphylaxis', 'severe allergy', 'unconscious', 'faint', 'shwas gundmarne',
      'श्वास गुदमरणे', 'तीव्र ॲलर्जी', 'घसा सुजणे', 'बेहोश', 'शुद्ध हरपणे', 'गंभीर श्वास त्रास'
    ],
    content_mr: '⚠️ आपत्कालीन इशारा: श्वास घेता न येणे, ओठ किंवा घसा अचानक सुजून श्वास गुदमरणे, किंवा वारकरी बेशुद्ध पडल्यास ताबडतोब वारीरक्षक SOS बटन दाबा. वारकऱ्याला हवेशीर मोकळ्या जागेत झोपवा आणि मान किंचित वर ठेवा.',
    content_hi: '⚠️ आपातकालीन चेतावनी: सांस न ले पाना, गले में तेज सूजन या मरीज का बेहोश हो जाना गंभीर आपातकाल है। तुरंत लाल SOS बटन दबाएं और पास के मेडिकल कैंप को अलर्ट करें।',
    content_en: '⚠️ EMERGENCY ALERT: Inability to breathe, severe throat/lip swelling (anaphylaxis), or loss of consciousness requires immediate emergency intervention. Press the SOS button right away.',
    severityDefault: 'emergency',
  },

  // ===================== 5. VARIRAKSHA APP ACTIONS & CONNECTIVITY =====================
  {
    id: 'app-dindi-leader-contact',
    category: 'app_guidance',
    title: 'Contacting Dindi Leader and Flag Coordination (दिंडी प्रमुख संपर्क)',
    keywords: [
      'leader', 'malak', 'dindi chief', 'flag', 'zenda', 'lost', 'haravle', 'sopanrao', 'patil',
      'दिंडी प्रमुख', 'दिंडी मालक', 'झेंडा', 'हरवले', 'मागे पडलो', 'संपर्क', 'लीडर', 'प्रमुख'
    ],
    content_mr: 'दिंडीतील वारकरी मागे पडल्यास किंवा हरवल्यास वारीरक्षक ॲपमधील "Call Dindi Leader" पर्यायावर टॅप करून थेट दिंडी प्रमुखांशी बोलू शकता. तसेच मुख्य झेंड्याचे स्थान व पुढील एकत्र येण्याची जागा ॲपवर पाहू शकता.',
    content_hi: 'दिंडी में पीछे छूट जाने या बिछड़ जाने पर वारीरक्षक ऐप से "Call Dindi Leader" बटन दबाकर सीधे दिंडी प्रमुख से संपर्क कर सकते हैं। मुख्य ध्वज (झेंडा) का लाइव स्थान भी देख सकते हैं।',
    content_en: 'If you drift behind your Dindi, tap "Call Dindi Leader" in the app to directly call your group leader. You can also view the Dindi flag location and next designated meetup point.',
    severityDefault: 'low',
  },
  {
    id: 'app-emergency-card-qr',
    category: 'app_guidance',
    title: 'Emergency Medical Card and QR Code (वैद्यकीय आपत्कालीन कार्ड)',
    keywords: [
      'qr', 'card', 'emergency id', 'medical card', 'badge', 'barcode', 'scan',
      'क्यूआर कोड', 'आपत्कालीन कार्ड', 'मेडिकल आयडी', 'तपासणी', 'कार्ड'
    ],
    content_mr: 'तुमचे वारीरक्षक डिजिटल आपत्कालीन कार्ड (QR Code) तुमच्या प्रोफाइल व होम स्क्रीनवर उपलब्ध आहे. कोणत्याही आपत्कालीन परिस्थितीत डॉक्टर किंवा स्वयंसेवक तुमचा क्यूआर कोड स्कॅन करून तुमचा रक्तगट, आजार आणि आपत्कालीन संपर्क त्वरित पाहू शकतात.',
    content_hi: 'आपका वारीरक्षक डिजिटल इमरजेंसी कार्ड (QR Code) प्रोफाइल और होम स्क्रीन पर मौजूद है। आपातकाल में कोई भी डॉक्टर या स्वयंसेवक इसे स्कैन करके आपका ब्लड ग्रुप और बीमारी तुरंत जान सकते हैं।',
    content_en: 'Your VariRaksha Digital Emergency Card QR is available on the Home and Profile screens. In an emergency, any responder or doctor can scan it to instantly view your blood group, conditions, and contacts without unlocking your phone.',
    severityDefault: 'low',
  },
];

/**
 * Enhanced Semantic & Keyword RAG Retriever
 * Scores knowledge documents against user query and context using token matching,
 * weighted domain relevance, and severity matching.
 */
export function retrieveRelevantKnowledge(
  query: string,
  topK: number = 3,
  preferredLang: 'mr' | 'hi' | 'en' = 'mr'
): KnowledgeDocument[] {
  if (!query || !query.trim()) {
    return GLOBAL_KNOWLEDGE_BASE.slice(0, topK);
  }

  const normalizedQuery = query.toLowerCase();
  const queryTokens = normalizedQuery
    .replace(/[^\w\s\u0900-\u097F]/g, ' ')
    .split(/\s+/)
    .filter((t) => t.length > 1);

  const scoredDocs = GLOBAL_KNOWLEDGE_BASE.map((doc) => {
    let score = 0;

    // 1. Keyword direct match
    for (const kw of doc.keywords) {
      const lowerKw = kw.toLowerCase();
      if (normalizedQuery.includes(lowerKw)) {
        score += 8; // High boost for exact keyword match
      }
      for (const token of queryTokens) {
        if (lowerKw.includes(token) || token.includes(lowerKw)) {
          score += 3;
        }
      }
    }

    // 2. Title & content matches
    const content =
      preferredLang === 'en'
        ? doc.content_en
        : preferredLang === 'hi'
        ? doc.content_hi
        : doc.content_mr;

    for (const token of queryTokens) {
      if (doc.title.toLowerCase().includes(token)) {
        score += 4;
      }
      if (content.toLowerCase().includes(token)) {
        score += 2;
      }
    }

    // 3. Category domain boosts for emergency terms
    const emergencyTerms = [
      'chest', 'heart', 'stroke', 'unconscious', 'faint', 'chhati', 'attack', 'paralysis',
      'छाती', 'कळ', 'हार्ट', 'बेशुद्ध', 'पक्षाघात', 'लकवा', 'सीने में दर्द'
    ];
    const isEmergencyQuery = emergencyTerms.some((term) => normalizedQuery.includes(term));
    if (isEmergencyQuery && doc.category === 'emergency_protocol') {
      score += 15;
    }

    return { doc, score };
  });

  scoredDocs.sort((a, b) => b.score - a.score);

  // Return top matches with score > 0 or fallback to default topK
  const relevant = scoredDocs.filter((s) => s.score > 0).map((s) => s.doc);
  if (relevant.length > 0) {
    return relevant.slice(0, topK);
  }

  return GLOBAL_KNOWLEDGE_BASE.slice(0, topK);
}

/**
 * Format retrieved documents into clean, compact context for LLM prompt
 */
export function formatKnowledgeForPrompt(
  docs: KnowledgeDocument[],
  lang: 'mr' | 'hi' | 'en' = 'mr'
): string {
  if (!docs || docs.length === 0) return '';

  return docs
    .map((d, index) => {
      const text = lang === 'en' ? d.content_en : lang === 'hi' ? d.content_hi : d.content_mr;
      return `[Knowledge Doc ${index + 1}: ${d.title}]\n${text}`;
    })
    .join('\n\n');
}
