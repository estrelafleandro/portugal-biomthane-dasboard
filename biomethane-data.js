/* Biomethane feedstock data — derived from the Floene feedstock workbook (20/04/2026).
   Sources: INE, GPP, APA (RARU), SRIR, ERSAR (RASARP), Águas de Portugal.
   Conversion: biogás (Nm³/ano) → biometano (GWh/ano) × 0,0055 GWh / 1000 Nm³  (PCI CH4 ~55%). */
(function () {
  var GWH_PER_NM3 = 0.0055 / 1000; // 5.5e-6

  // Three feedstock axes. Each declares its data-entry fields and a biogás formula.
  var AXES = {
    RSU: {
      id: 'RSU', short: 'RSU', label: 'RSU — Fração Orgânica',
      full: 'Resíduos Sólidos Urbanos (fração orgânica)',
      color: '#3D5AC2', tint: '#EEF1FB',
      card: { title: 'RSU', sub: 'Resíduos Orgânicos' }, comp: 'Resíduos Sólidos Urbanos',
      fonte: 'INE / GPP',
      factorNote: 'Fração orgânica × 120 Nm³/t',
      inputs: [
        { key: 'residuosUrbanos', label: 'Resíduos urbanos', unit: 't/ano', step: 1000, ph: 'ex: 60 000' },
        { key: 'fracaoOrganicaPct', label: 'Fração orgânica', unit: '%', step: 1, def: 33, ph: '33' }
      ],
      biogas: function (v) { return (Number(v.residuosUrbanos) || 0) * ((Number(v.fracaoOrganicaPct) || 0) / 100) * 120; }
    },
    AGRO: {
      id: 'AGRO', short: 'Agro', label: 'Agropecuário e Florestal',
      full: 'Efluentes pecuários e resíduos florestais',
      color: '#E0832F', tint: '#FFF3E6',
      card: { title: 'Agropecuário', sub: 'Agrícola e Florestal' }, comp: 'Agropecuário',
      fonte: 'APA / SRIR / GPP',
      factorNote: 'Agro × 80 + Florestais × 60 Nm³/t',
      inputs: [
        { key: 'residuosAgro', label: 'Resíduos agro', unit: 't/ano', step: 1000, ph: 'ex: 30 000' },
        { key: 'residuosFlorestais', label: 'Resíduos florestais', unit: 't/ano', step: 500, ph: 'ex: 5 000' }
      ],
      biogas: function (v) { return (Number(v.residuosAgro) || 0) * 80 + (Number(v.residuosFlorestais) || 0) * 60; }
    },
    ETAR: {
      id: 'ETAR', short: 'ETAR', label: 'ETAR — Águas Residuais',
      full: 'Lamas de estações de tratamento de águas residuais',
      color: '#1F9D78', tint: '#E7F6F0',
      card: { title: 'ETAR', sub: 'Águas Residuais' }, comp: 'Saneamento (ETAR)',
      fonte: 'ERSAR / AdP',
      factorNote: 'Lamas × 300 Nm³/t MS',
      inputs: [
        { key: 'lamas', label: 'Lamas produzidas', unit: 't MS/ano', step: 500, ph: 'ex: 4 000' }
      ],
      biogas: function (v) { return (Number(v.lamas) || 0) * 300; }
    }
  };

  function gwhOf(axisId, inputs) {
    var ax = AXES[axisId];
    if (!ax) return 0;
    return ax.biogas(inputs) * GWH_PER_NM3;
  }

  // 18 mainland districts → NUT II region (used for the regional filter / colouring fallback).
  var NUT2 = {
    'Aveiro': 'Centro', 'Beja': 'Alentejo', 'Braga': 'Norte', 'Bragança': 'Norte',
    'Castelo Branco': 'Centro', 'Coimbra': 'Centro', 'Évora': 'Alentejo', 'Faro': 'Algarve',
    'Guarda': 'Centro', 'Leiria': 'Centro', 'Lisboa': 'AML', 'Portalegre': 'Alentejo',
    'Porto': 'Norte', 'Santarém': 'Centro', 'Setúbal': 'AML', 'Viana do Castelo': 'Norte',
    'Vila Real': 'Norte', 'Viseu': 'Centro'
  };
  var DISTRICTS = Object.keys(NUT2);

  // Approx centroid (lon,lat) per district — fallback pin anchor when a source has no coordinate.
  var CENTROID = {
    'Aveiro': [-8.46, 40.66], 'Beja': [-7.86, 37.97], 'Braga': [-8.30, 41.58], 'Bragança': [-6.86, 41.66],
    'Castelo Branco': [-7.42, 39.96], 'Coimbra': [-8.27, 40.18], 'Évora': [-7.74, 38.62], 'Faro': [-7.95, 37.18],
    'Guarda': [-7.18, 40.62], 'Leiria': [-8.70, 39.66], 'Lisboa': [-9.10, 38.92], 'Portalegre': [-7.50, 39.20],
    'Porto': [-8.42, 41.18], 'Santarém': [-8.40, 39.30], 'Setúbal': [-8.62, 38.42], 'Viana do Castelo': [-8.50, 41.85],
    'Vila Real': [-7.62, 41.42], 'Viseu': [-7.85, 40.74]
  };

  // Base records — potencial agregado por distrito (GWh/ano, ref. 2030).
  // Fonte: Supply_&_Demand_Geolocalizada v.16 (2024), sheet "Oferta Agregada".
  var SEED = [
    { axis: 'AGRO', distrito: 'Aveiro',          local: 'Aveiro',          lat: 40.66, lon: -8.46, gwh: 652.9658,  fonte: 'Supply & Demand 2024' },
    { axis: 'AGRO', distrito: 'Beja',             local: 'Beja',            lat: 37.97, lon: -7.86, gwh: 62.3712,   fonte: 'Supply & Demand 2024' },
    { axis: 'AGRO', distrito: 'Braga',            local: 'Braga',           lat: 41.58, lon: -8.30, gwh: 91.8048,   fonte: 'Supply & Demand 2024' },
    { axis: 'AGRO', distrito: 'Bragança',         local: 'Bragança',        lat: 41.66, lon: -6.86, gwh: 28.032,    fonte: 'Supply & Demand 2024' },
    { axis: 'AGRO', distrito: 'Castelo Branco',   local: 'Castelo Branco',  lat: 39.96, lon: -7.42, gwh: 32.1779,   fonte: 'Supply & Demand 2024' },
    { axis: 'AGRO', distrito: 'Coimbra',          local: 'Coimbra',         lat: 40.18, lon: -8.27, gwh: 63.2503,   fonte: 'Supply & Demand 2024' },
    { axis: 'AGRO', distrito: 'Faro',             local: 'Faro',            lat: 37.18, lon: -7.95, gwh: 103.5437,  fonte: 'Supply & Demand 2024' },
    { axis: 'AGRO', distrito: 'Leiria',           local: 'Leiria',          lat: 39.66, lon: -8.70, gwh: 47.1597,   fonte: 'Supply & Demand 2024' },
    { axis: 'AGRO', distrito: 'Lisboa',           local: 'Lisboa',          lat: 38.92, lon: -9.10, gwh: 765.71,    fonte: 'Supply & Demand 2024' },
    { axis: 'AGRO', distrito: 'Portalegre',       local: 'Portalegre',      lat: 39.20, lon: -7.50, gwh: 4.1715,    fonte: 'Supply & Demand 2024' },
    { axis: 'AGRO', distrito: 'Porto',            local: 'Porto',           lat: 41.18, lon: -8.42, gwh: 108.4265,  fonte: 'Supply & Demand 2024' },
    { axis: 'AGRO', distrito: 'Santarém',         local: 'Santarém',        lat: 39.30, lon: -8.40, gwh: 49.7414,   fonte: 'Supply & Demand 2024' },
    { axis: 'AGRO', distrito: 'Setúbal',          local: 'Setúbal',         lat: 38.42, lon: -8.62, gwh: 230.0613,  fonte: 'Supply & Demand 2024' },
    { axis: 'AGRO', distrito: 'Viana do Castelo', local: 'Viana do Castelo',lat: 41.85, lon: -8.50, gwh: 106.5216,  fonte: 'Supply & Demand 2024' },
    { axis: 'AGRO', distrito: 'Vila Real',        local: 'Vila Real',       lat: 41.42, lon: -7.62, gwh: 44.8512,   fonte: 'Supply & Demand 2024' },
    { axis: 'AGRO', distrito: 'Viseu',            local: 'Viseu',           lat: 40.74, lon: -7.85, gwh: 57.2885,   fonte: 'Supply & Demand 2024' },
    { axis: 'AGRO', distrito: 'Évora',            local: 'Évora',           lat: 38.62, lon: -7.74, gwh: 4.2294,    fonte: 'Supply & Demand 2024' }
  ];

  // Materialise seed records: add id + computed gwh (uses s.gwh directly if present).
  var SOURCES = SEED.map(function (s, i) {
    return {
      id: 'seed-' + i,
      axis: s.axis, distrito: s.distrito, local: s.local,
      lat: s.lat, lon: s.lon, inputs: s.inputs || {},
      gwh: s.gwh != null ? s.gwh : gwhOf(s.axis, s.inputs || {}),
      fonte: s.fonte, origin: 'base'
    };
  });

  /* ----------------------------------------------------------------------
     FEEDSTOCK TAXONOMY + CONVERSION — BioCH4 Simulator Floene (xlsm)
     ----------------------------------------------------------------------
     Feedstock options and labels match the BioCH4 Simulator Excel exactly.
     Conversion factors (mwhPerTon) from sheet "Technical Assessment" of
     BioCH4 Simulator Floene - Internal.xlsm (source: AEBIG).
     Chain: fresh tons/year → biogas (m³/year) → biomethane (MWh/year).
     Reference scenario: Pigs 9 500 t/y → 217 989 m³ biogas → 1 493.31 MWh/y
       (= 9 500 × 0.15719 MWh/t). */
  var KWH_PER_M3_CH4 = 9.97;

  // group → map axis (RSU / AGRO) + input unit. Categories match BioCH4 Simulator.
  var FS_GROUPS = [
    { id: 'PEC',   axis: 'AGRO', label: 'Livestock',            unit: 't/ano' },
    { id: 'AGRIC', axis: 'AGRO', label: 'Agricultural Crops',   unit: 't/ano' },
    { id: 'AGRIND',axis: 'AGRO', label: 'Agroindustrial Waste', unit: 't/ano' },
    { id: 'RSU',   axis: 'RSU',  label: 'Urban Wastes',         unit: 't/ano' }
  ];

  // mwhPerTon: MWh of biomethane per fresh ton (from Technical Assessment sheet).
  // ch4: methane fraction in biogas (used to derive displayed m³ biogas estimate).
  var FEEDSTOCKS_RAW = [
    // ---- Livestock ----
    { id: 'bov_leite',   group: 'PEC',   label: 'Cattle — Dairy or Breeding',                                                                          ch4: 0.55, mwhPerTon: 0.18075 },
    { id: 'bov_engorda', group: 'PEC',   label: 'Cattle — Fattening Calves and Heifers',                                                               ch4: 0.55, mwhPerTon: 0.47740 },
    { id: 'suinos',      group: 'PEC',   label: 'Pigs',                                                                                                ch4: 0.60, mwhPerTon: 0.15719 },
    { id: 'aves_galin',  group: 'PEC',   label: 'Poultry — Layers or Chickens',                                                                        ch4: 0.60, mwhPerTon: 0.80437 },
    { id: 'aves_patos',  group: 'PEC',   label: 'Poultry — Ducks',                                                                                     ch4: 0.60, mwhPerTon: 0.50044 },
    { id: 'aves_perus',  group: 'PEC',   label: 'Poultry — Turkeys',                                                                                   ch4: 0.60, mwhPerTon: 0.80437 },
    { id: 'equinos',     group: 'PEC',   label: 'Equines',                                                                                              ch4: 0.55, mwhPerTon: 0.56738 },
    { id: 'ovinos',      group: 'PEC',   label: 'Sheeps',                                                                                               ch4: 0.55, mwhPerTon: 0.53516 },
    { id: 'caprinos',    group: 'PEC',   label: 'Goats',                                                                                                ch4: 0.55, mwhPerTon: 0.54098 },
    // ---- Agricultural Crops ----
    { id: 'palha_cer',   group: 'AGRIC', label: 'Wheat straw, barley, triticale, rye and winter cereals, oats and spring cereals, other cereal grains', ch4: 0.53, mwhPerTon: 1.90786 },
    { id: 'palha_milho', group: 'AGRIC', label: 'Corn Straw',                                                                                           ch4: 0.53, mwhPerTon: 1.91947 },
    { id: 'palha_arroz', group: 'AGRIC', label: 'Rice Straw',                                                                                           ch4: 0.53, mwhPerTon: 1.74196 },
    { id: 'palha_sorgo', group: 'AGRIC', label: 'Sorghum Straw',                                                                                        ch4: 0.53, mwhPerTon: 1.98417 },
    { id: 'vinicola',    group: 'AGRIC', label: 'Winemaking by-products (stems and lees)',                                                               ch4: 0.55, mwhPerTon: 0.84227 },
    // ---- Agroindustrial Waste ----
    { id: 'carne_peixe', group: 'AGRIND',label: 'Meat and Fish Industry (raw materials and llamas)',                                                     ch4: 0.62, mwhPerTon: 0.72992 },
    { id: 'soro',        group: 'AGRIND',label: 'Milk and Dairy Products — Serum',                                                                      ch4: 0.58, mwhPerTon: 0.11021 },
    { id: 'lamas_lact',  group: 'AGRIND',label: 'Milk and Dairy Products — Lamas',                                                                      ch4: 0.60, mwhPerTon: 0.33561 },
    { id: 'lact_outros', group: 'AGRIND',label: 'Milk and Dairy Products — Dairy and other raw materials',                                              ch4: 0.58, mwhPerTon: 0.26268 },
    { id: 'bagaco_azt',  group: 'AGRIND',label: 'Olive Oil — Olive Pomace',                                                                             ch4: 0.55, mwhPerTon: 0.89497 },
    { id: 'aguas_rucas', group: 'AGRIND',label: 'Olive Oil — Ruddy Waters',                                                                             ch4: 0.60, mwhPerTon: 0.41177 },
    { id: 'dreche',      group: 'AGRIND',label: 'Alcoholic Beverages — Bagasse from the brewing industry',                                              ch4: 0.58, mwhPerTon: 0.98645 },
    { id: 'sidra',       group: 'AGRIND',label: 'Alcoholic Beverages — Cider industry raw materials',                                                   ch4: 0.58, mwhPerTon: 0.77481 },
    { id: 'citrinos',    group: 'AGRIND',label: 'Fruits and Vegetables — Citrus (surplus and non-compliant)',                                            ch4: 0.58, mwhPerTon: 0.58949 },
    { id: 'frutos_nc',   group: 'AGRIND',label: 'Fruits and Vegetables — Non-citrus fruits (surplus and non-compliant)',                                 ch4: 0.58, mwhPerTon: 0.79160 },
    { id: 'horticolas',  group: 'AGRIND',label: 'Fruits and Vegetables — Vegetable products (surplus and non-compliant)',                                ch4: 0.58, mwhPerTon: 0.32451 },
    { id: 'tuberculos',  group: 'AGRIND',label: 'Fruits and Vegetables — Tubers (surplus and non-compliant)',                                            ch4: 0.58, mwhPerTon: 0.48688 },
    { id: 'transf_citr', group: 'AGRIND',label: 'Processing Industry — Citrus transformation',                                                          ch4: 0.58, mwhPerTon: 0.39379 },
    { id: 'transf_frut', group: 'AGRIND',label: 'Processing Industry — Processing of non-citrus fruits',                                                ch4: 0.58, mwhPerTon: 0.29206 },
    { id: 'transf_hort', group: 'AGRIND',label: 'Processing Industry — Processing of vegetable products',                                               ch4: 0.58, mwhPerTon: 0.28175 },
    { id: 'transf_tub',  group: 'AGRIND',label: 'Processing Industry — Tuber processing',                                                               ch4: 0.58, mwhPerTon: 0.43532 },
    { id: 'lamas_veg',   group: 'AGRIND',label: 'Processing Industry — Sludge from vegetable processing',                                               ch4: 0.60, mwhPerTon: 0.30992 },
    { id: 'glicerina',   group: 'AGRIND',label: 'Glycerin',                                                                                              ch4: 0.60, mwhPerTon: 5.23467 },
    // ---- Urban Wastes ----
    { id: 'ofmsw',       group: 'RSU',   label: 'Organic fraction of Municipal Solid Waste',                                                             ch4: 0.53, mwhPerTon: 0.59377 }
  ];

  var GROUP_BY_ID = {}; FS_GROUPS.forEach(function (g) { GROUP_BY_ID[g.id] = g; });

  var FEEDSTOCKS = FEEDSTOCKS_RAW.map(function (f) {
    var g = GROUP_BY_ID[f.group];
    var m3 = f.mwhPerTon * 1000 / (f.ch4 * KWH_PER_M3_CH4); // derived m³/t for display
    return {
      id: f.id, group: f.group, groupLabel: g.label, axis: g.axis, unit: g.unit,
      label: f.label, m3PerTon: m3, ch4: f.ch4,
      mwhPerTon: f.mwhPerTon
    };
  });
  var FS_INDEX = {}; FEEDSTOCKS.forEach(function (f) { FS_INDEX[f.id] = f; });

  function feedstockById(id) { return FS_INDEX[id]; }
  function feedstockBiogasM3(id, tons) { var f = FS_INDEX[id]; return f ? (Number(tons) || 0) * f.m3PerTon : 0; }
  function feedstockMwh(id, tons) { var f = FS_INDEX[id]; return f ? (Number(tons) || 0) * f.mwhPerTon : 0; }
  function feedstockGwh(id, tons) { return feedstockMwh(id, tons) / 1000; }

  // Supply projections from Oferta Agregada (Supply_&_Demand_Geolocalizada, 2024).
  // 278 concelhos; 114 with non-zero supply. GWh of renewable biomethane per year.
  var SUPPLY_TIMELINE = [
    { dso: 'Beiragás', concelho: 'São Pedro do Sul', consumoGas: 'Não', distrito: 'Viseu', gwh: {'2025':0.0, '2030':4.2048, '2035':15.9782, '2040':21.024, '2045':27.3312, '2050':32.377} },
    { dso: 'Beiragás', concelho: 'Proença-a-Nova', consumoGas: 'Não', distrito: 'Castelo Branco', gwh: {'2025':0.0, '2030':0.0, '2035':7.9891, '2040':10.512, '2045':13.6656, '2050':16.1885} },
    { dso: 'Beiragás', concelho: 'Sertã', consumoGas: 'Não', distrito: 'Castelo Branco', gwh: {'2025':0.0, '2030':0.0, '2035':0.0, '2040':0.0, '2045':0.0, '2050':11.4748} },
    { dso: 'Beiragás', concelho: 'Mortágua', consumoGas: 'Sim', distrito: 'Viseu', gwh: {'2025':0.0, '2030':0.0, '2035':17.1265, '2040':29.9715, '2045':47.098, '2050':62.6431} },
    { dso: 'Beiragás', concelho: 'Nelas', consumoGas: 'Sim', distrito: 'Viseu', gwh: {'2025':0.0, '2030':0.0, '2035':0.0, '2040':0.0, '2045':0.0, '2050':5.2741} },
    { dso: 'Beiragás', concelho: 'Tondela', consumoGas: 'Sim', distrito: 'Viseu', gwh: {'2025':19.0949, '2030':39.0677, '2035':64.3666, '2040':96.1533, '2045':112.6221, '2050':127.6192} },
    { dso: 'Beiragás', concelho: 'Lamego', consumoGas: 'Sim', distrito: 'Viseu', gwh: {'2025':7.008, '2030':14.016, '2035':19.9728, '2040':28.032, '2045':31.536, '2050':35.04} },
    { dso: 'Beiragás', concelho: 'Fundão', consumoGas: 'Sim', distrito: 'Castelo Branco', gwh: {'2025':15.4176, '2030':30.8352, '2035':43.9402, '2040':61.6704, '2045':69.3792, '2050':77.088} },
    { dso: 'Beiragás', concelho: 'Oliveira de Frades', consumoGas: 'Não', distrito: 'Viseu', gwh: {'2025':0.0, '2030':0.0, '2035':10.6522, '2040':14.016, '2045':18.2208, '2050':32.377} },
    { dso: 'Beiragás', concelho: 'Belmonte', consumoGas: 'Não', distrito: 'Castelo Branco', gwh: {'2025':0.0, '2030':0.0, '2035':0.0, '2040':0.0, '2045':11.7745, '2050':14.3435} },
    { dso: 'Beiragás', concelho: 'Santa Comba Dão', consumoGas: 'Sim', distrito: 'Viseu', gwh: {'2025':0.0, '2030':0.0, '2035':0.0, '2040':0.0, '2045':0.0, '2050':5.1288} },
    { dso: 'Beiragás', concelho: 'Castelo Branco', consumoGas: 'Sim', distrito: 'Castelo Branco', gwh: {'2025':0.0147, '2030':1.3427, '2035':2.6707, '2040':3.9986, '2045':4.6626, '2050':0.0} },
    { dso: 'Beiragás', concelho: 'Vila Velha de Ródão', consumoGas: 'Sim', distrito: 'Castelo Branco', gwh: {'2025':0.0, '2030':0.0, '2035':68.5062, '2040':119.8858, '2045':188.392, '2050':229.4957} },
    { dso: 'Beiragás', concelho: 'Mangualde', consumoGas: 'Sim', distrito: 'Viseu', gwh: {'2025':0.0, '2030':0.0, '2035':34.2531, '2040':59.9429, '2045':94.196, '2050':114.7479} },
    { dso: 'Beiragás', concelho: 'Vouzela', consumoGas: 'Não', distrito: 'Viseu', gwh: {'2025':0.0, '2030':0.0, '2035':0.0, '2040':0.0, '2045':9.1104, '2050':10.7923} },
    { dso: 'Dianagás', concelho: 'Sines', consumoGas: 'Sim', distrito: 'Setúbal', gwh: {'2025':40.296, '2030':104.7696, '2035':145.8708, '2040':169.3884, '2045':177.8288, '2050':182.9489} },
    { dso: 'Dianagás', concelho: 'Évora', consumoGas: 'Sim', distrito: 'Évora', gwh: {'2025':1.4173, '2030':4.2294, '2035':6.8312, '2040':9.8536, '2045':11.2596, '2050':12.6657} },
    { dso: 'Dianagás - Potential', concelho: 'Alandroal', consumoGas: 'Not Available', distrito: 'Évora', gwh: {'2025':0.0, '2030':0.0, '2035':0.0, '2040':0.0, '2045':0.0, '2050':5.3962} },
    { dso: 'Dianagás - Potential', concelho: 'Arraiolos', consumoGas: 'Not Available', distrito: 'Évora', gwh: {'2025':0.0, '2030':0.0, '2035':0.0, '2040':0.0, '2045':0.0, '2050':5.3962} },
    { dso: 'Dianagás - Potential', concelho: 'Borba', consumoGas: 'Not Available', distrito: 'Évora', gwh: {'2025':0.0, '2030':0.0, '2035':0.0, '2040':0.0, '2045':0.0, '2050':5.3962} },
    { dso: 'Dianagás - Potential', concelho: 'Montemor-o-Novo', consumoGas: 'Not Available', distrito: 'Évora', gwh: {'2025':0.0, '2030':0.0, '2035':0.0, '2040':21.024, '2045':27.3312, '2050':53.9616} },
    { dso: 'Dianagás - Potential', concelho: 'Portel', consumoGas: 'Not Available', distrito: 'Évora', gwh: {'2025':0.0, '2030':0.0, '2035':0.0, '2040':0.0, '2045':0.0, '2050':10.7923} },
    { dso: 'Dianagás - Potential', concelho: 'Vendas Novas', consumoGas: 'Not Available', distrito: 'Évora', gwh: {'2025':0.0, '2030':0.0, '2035':0.0, '2040':0.0, '2045':0.0, '2050':5.3962} },
    { dso: 'Duriensegás', concelho: 'Chaves', consumoGas: 'Sim', distrito: 'Vila Real', gwh: {'2025':0.0, '2030':0.0, '2035':0.0, '2040':0.0, '2045':0.0, '2050':5.2875} },
    { dso: 'Duriensegás', concelho: 'Vila Real', consumoGas: 'Sim', distrito: 'Vila Real', gwh: {'2025':9.8112, '2030':19.6224, '2035':27.9619, '2040':39.2448, '2045':44.1504, '2050':49.056} },
    { dso: 'Lisboagás', concelho: 'Sintra', consumoGas: 'Sim', distrito: 'Lisboa', gwh: {'2025':0.9418, '2030':3.0442, '2035':22.2019, '2040':29.7706, '2045':39.2314, '2050':62.3557} },
    { dso: 'Lisboagás', concelho: 'Amadora', consumoGas: 'Sim', distrito: 'Lisboa', gwh: {'2025':0.0, '2030':0.0, '2035':0.0, '2040':8.5715, '2045':17.3897, '2050':22.739} },
    { dso: 'Lisboagás', concelho: 'Lisboa', consumoGas: 'Sim', distrito: 'Lisboa', gwh: {'2025':3.2896, '2030':7.304, '2035':14.5277, '2040':21.7515, '2045':25.3633, '2050':28.9752} },
    { dso: 'Lisboagás', concelho: 'Torres Vedras', consumoGas: 'Sim', distrito: 'Lisboa', gwh: {'2025':3.2685, '2030':9.9261, '2035':47.2086, '2040':63.1869, '2045':83.1597, '2050':125.2013} },
    { dso: 'Lisboagás', concelho: 'Loures', consumoGas: 'Sim', distrito: 'Lisboa', gwh: {'2025':7.8503, '2030':24.6758, '2035':89.8322, '2040':130.2968, '2045':166.9396, '2050':197.1302} },
    { dso: 'Lisboagás', concelho: 'Azambuja', consumoGas: 'Sim', distrito: 'Lisboa', gwh: {'2025':0.0, '2030':0.0, '2035':0.0, '2040':5.6774, '2045':7.4644, '2050':8.8941} },
    { dso: 'Lisboagás', concelho: 'Lourinhã', consumoGas: 'Não', distrito: 'Lisboa', gwh: {'2025':11.5632, '2030':23.1264, '2035':95.8694, '2040':126.144, '2045':173.0976, '2050':205.0541} },
    { dso: 'Lisboagás', concelho: 'Cadaval', consumoGas: 'Não', distrito: 'Lisboa', gwh: {'2025':49.056, '2030':98.112, '2035':139.8096, '2040':203.232, '2045':229.8624, '2050':256.0723} },
    { dso: 'Lisboagás', concelho: 'Vila Franca de Xira', consumoGas: 'Sim', distrito: 'Lisboa', gwh: {'2025':221.1176, '2030':561.3211, '2035':797.1076, '2040':1136.5245, '2045':1411.2183, '2050':1587.5415} },
    { dso: 'Lisboagás', concelho: 'Cascais', consumoGas: 'Sim', distrito: 'Lisboa', gwh: {'2025':1.7618, '2030':35.6002, '2035':69.2283, '2040':103.277, '2045':120.1961, '2050':137.1153} },
    { dso: 'Lisboagás', concelho: 'Mafra', consumoGas: 'Sim', distrito: 'Lisboa', gwh: {'2025':0.8482, '2030':2.6002, '2035':12.4114, '2040':16.6162, '2045':21.8722, '2050':36.6216} },
    { dso: 'Lusitaniagás', concelho: 'Marinha Grande', consumoGas: 'Sim', distrito: 'Leiria', gwh: {'2025':0.0, '2030':0.0, '2035':0.0, '2040':34.756, '2045':70.5122, '2050':92.2026} },
    { dso: 'Lusitaniagás', concelho: 'Mealhada', consumoGas: 'Sim', distrito: 'Aveiro', gwh: {'2025':0.0, '2030':0.0, '2035':0.0, '2040':0.0, '2045':0.0, '2050':15.7297} },
    { dso: 'Lusitaniagás', concelho: 'Rio Maior', consumoGas: 'Sim', distrito: 'Santarém', gwh: {'2025':0.0, '2030':0.0, '2035':0.0, '2040':0.0, '2045':0.0, '2050':15.5206} },
    { dso: 'Lusitaniagás', concelho: 'Alcobaça', consumoGas: 'Sim', distrito: 'Leiria', gwh: {'2025':1.1777, '2030':3.6305, '2035':20.172, '2040':71.6966, '2045':114.7737, '2050':154.079} },
    { dso: 'Lusitaniagás', concelho: 'Ílhavo', consumoGas: 'Sim', distrito: 'Aveiro', gwh: {'2025':169.9698, '2030':444.2066, '2035':616.4769, '2040':686.7809, '2045':687.9441, '2050':689.1072} },
    { dso: 'Lusitaniagás', concelho: 'Soure', consumoGas: 'Sim', distrito: 'Coimbra', gwh: {'2025':0.0, '2030':4.0073, '2035':19.7052, '2040':26.4329, '2045':34.8425, '2050':41.5702} },
    { dso: 'Lusitaniagás', concelho: 'Pombal', consumoGas: 'Sim', distrito: 'Leiria', gwh: {'2025':0.9046, '2030':26.3853, '2035':64.7892, '2040':81.0477, '2045':97.8669, '2050':137.3559} },
    { dso: 'Lusitaniagás', concelho: 'Leiria', consumoGas: 'Sim', distrito: 'Leiria', gwh: {'2025':2.113, '2030':7.4698, '2035':46.1584, '2040':176.0714, '2045':314.1408, '2050':474.9346} },
    { dso: 'Lusitaniagás', concelho: 'Aveiro', consumoGas: 'Sim', distrito: 'Aveiro', gwh: {'2025':16.8611, '2030':37.4578, '2035':141.1642, '2040':228.5083, '2045':324.4393, '2050':386.1173} },
    { dso: 'Lusitaniagás', concelho: 'Batalha', consumoGas: 'Sim', distrito: 'Leiria', gwh: {'2025':0.0, '2030':0.0, '2035':0.0, '2040':0.0, '2045':8.6858, '2050':10.3677} },
    { dso: 'Lusitaniagás', concelho: 'Oliveira de Azeméis', consumoGas: 'Sim', distrito: 'Aveiro', gwh: {'2025':0.0, '2030':0.0, '2035':17.1265, '2040':29.9715, '2045':47.098, '2050':51.9778} },
    { dso: 'Lusitaniagás', concelho: 'Bombarral', consumoGas: 'Não', distrito: 'Leiria', gwh: {'2025':1.752, '2030':3.504, '2035':13.3152, '2040':17.52, '2045':22.776, '2050':26.9808} },
    { dso: 'Lusitaniagás', concelho: 'Ovar', consumoGas: 'Sim', distrito: 'Aveiro', gwh: {'2025':0.0, '2030':0.0, '2035':0.0, '2040':6.5657, '2045':8.6681, '2050':15.609} },
    { dso: 'Lusitaniagás', concelho: 'Caldas da Rainha', consumoGas: 'Sim', distrito: 'Leiria', gwh: {'2025':1.3964, '2030':6.1701, '2035':29.7169, '2040':39.8085, '2045':52.4229, '2050':67.7286} },
    { dso: 'Lusitaniagás', concelho: 'Cantanhede', consumoGas: 'Sim', distrito: 'Coimbra', gwh: {'2025':0.0, '2030':4.0073, '2035':19.7052, '2040':26.4329, '2045':34.8425, '2050':41.5702} },
    { dso: 'Lusitaniagás', concelho: 'Santa Maria da Feira', consumoGas: 'Sim', distrito: 'Aveiro', gwh: {'2025':84.096, '2030':168.192, '2035':239.6736, '2040':343.392, '2045':387.5424, '2050':436.5367} },
    { dso: 'Lusitaniagás', concelho: 'São João da Madeira', consumoGas: 'Sim', distrito: 'Aveiro', gwh: {'2025':0.0, '2030':0.0, '2035':0.0, '2040':0.0, '2045':0.0, '2050':5.1799} },
    { dso: 'Lusitaniagás', concelho: 'Figueira da Foz', consumoGas: 'Sim', distrito: 'Coimbra', gwh: {'2025':5.0139, '2030':16.8288, '2035':364.1141, '2040':607.6934, '2045':934.1451, '2050':1141.0827} },
    { dso: 'Lusitaniagás', concelho: 'Coimbra', consumoGas: 'Sim', distrito: 'Coimbra', gwh: {'2025':15.5008, '2030':38.4069, '2035':83.138, '2040':330.1619, '2045':594.6357, '2050':759.5755} },
    { dso: 'Lusitaniagás', concelho: 'Peniche', consumoGas: 'Sim', distrito: 'Leiria', gwh: {'2025':0.0, '2030':0.0, '2035':0.0, '2040':0.0, '2045':0.0, '2050':5.2872} },
    { dso: 'Lusitaniagás', concelho: 'Espinho', consumoGas: 'Sim', distrito: 'Aveiro', gwh: {'2025':3.0753, '2030':3.1094, '2035':6.1847, '2040':9.26, '2045':10.7977, '2050':12.3353} },
    { dso: 'Lusitaniagás', concelho: 'Estarreja', consumoGas: 'Sim', distrito: 'Aveiro', gwh: {'2025':0.0, '2030':0.0, '2035':0.9029, '2040':15.926, '2045':27.4932, '2050':29.5205} },
    { dso: 'Medigás', concelho: 'Portimão', consumoGas: 'Sim', distrito: 'Faro', gwh: {'2025':33.6384, '2030':67.2768, '2035':95.8694, '2040':134.5536, '2045':151.3728, '2050':173.3907} },
    { dso: 'Medigás - Potential', concelho: 'Lagos', consumoGas: 'Not Available', distrito: 'Faro', gwh: {'2025':1.3142, '2030':2.6285, '2035':3.9427, '2040':5.257, '2045':5.9141, '2050':6.5712} },
    { dso: 'Medigás - Potential', concelho: 'Loulé', consumoGas: 'Not Available', distrito: 'Faro', gwh: {'2025':16.8192, '2030':33.6384, '2035':47.9347, '2040':67.2768, '2045':75.6864, '2050':84.096} },
    { dso: 'Paxgás', concelho: 'Beja', consumoGas: 'Sim', distrito: 'Beja', gwh: {'2025':0.0, '2030':0.0, '2035':3.9946, '2040':12.6144, '2045':15.4176, '2050':17.8003} },
    { dso: 'Paxgás - Potential', concelho: 'Cuba', consumoGas: 'Not Available', distrito: 'Beja', gwh: {'2025':3.1536, '2030':6.3072, '2035':23.9674, '2040':31.536, '2045':40.9968, '2050':59.3578} },
    { dso: 'Paxgás - Potential', concelho: 'Ferreira do Alentejo', consumoGas: 'Not Available', distrito: 'Beja', gwh: {'2025':26.28, '2030':52.56, '2035':199.728, '2040':269.808, '2045':350.7504, '2050':420.9005} },
    { dso: 'Paxgás - Potential', concelho: 'Moura', consumoGas: 'Not Available', distrito: 'Beja', gwh: {'2025':0.0, '2030':0.0, '2035':0.0, '2040':0.0, '2045':0.0, '2050':5.3962} },
    { dso: 'Paxgás - Potential', concelho: 'Odemira', consumoGas: 'Not Available', distrito: 'Beja', gwh: {'2025':0.0, '2030':0.0, '2035':0.0, '2040':0.0, '2045':0.0, '2050':5.3962} },
    { dso: 'Paxgás - Potential', concelho: 'Serpa', consumoGas: 'Not Available', distrito: 'Beja', gwh: {'2025':1.752, '2030':3.504, '2035':13.3152, '2040':17.52, '2045':22.776, '2050':26.9808} },
    { dso: 'Portgás', concelho: 'Amares', consumoGas: 'Not Available', distrito: 'Braga', gwh: {'2025':0.0, '2030':2.1024, '2035':7.9891, '2040':17.52, '2045':22.776, '2050':26.9808} },
    { dso: 'Portgás', concelho: 'Felgueiras', consumoGas: 'Not Available', distrito: 'Porto', gwh: {'2025':0.0, '2030':0.0, '2035':0.0, '2040':0.0, '2045':0.0, '2050':5.3962} },
    { dso: 'Portgás', concelho: 'Gondomar', consumoGas: 'Not Available', distrito: 'Porto', gwh: {'2025':2.8032, '2030':5.6064, '2035':7.9891, '2040':11.2128, '2045':12.6144, '2050':14.016} },
    { dso: 'Portgás', concelho: 'Guimarães', consumoGas: 'Not Available', distrito: 'Braga', gwh: {'2025':0.0, '2030':0.0, '2035':0.0, '2040':0.0, '2045':0.0, '2050':16.1885} },
    { dso: 'Portgás', concelho: 'Lousada', consumoGas: 'Not Available', distrito: 'Porto', gwh: {'2025':15.4176, '2030':30.8352, '2035':43.9402, '2040':61.6704, '2045':69.3792, '2050':77.088} },
    { dso: 'Portgás', concelho: 'Matosinhos', consumoGas: 'Not Available', distrito: 'Porto', gwh: {'2025':1.4016, '2030':2.8032, '2035':3.9946, '2040':5.6064, '2045':6.3072, '2050':7.008} },
    { dso: 'Portgás', concelho: 'Penafiel', consumoGas: 'Not Available', distrito: 'Porto', gwh: {'2025':8.4096, '2030':16.8192, '2035':57.2554, '2040':75.6864, '2045':97.4112, '2050':114.9312} },
    { dso: 'Portgás', concelho: 'Porto', consumoGas: 'Not Available', distrito: 'Porto', gwh: {'2025':9.1339, '2030':18.2678, '2035':27.4017, '2040':36.5356, '2045':41.1026, '2050':45.6695} },
    { dso: 'Portgás', concelho: 'Póvoa de Varzim', consumoGas: 'Not Available', distrito: 'Porto', gwh: {'2025':0.0, '2030':0.0, '2035':34.2531, '2040':59.9429, '2045':94.196, '2050':114.7479} },
    { dso: 'Portgás', concelho: 'Santo Tirso', consumoGas: 'Not Available', distrito: 'Porto', gwh: {'2025':15.4176, '2030':30.8352, '2035':43.9402, '2040':61.6704, '2045':69.3792, '2050':77.088} },
    { dso: 'Portgás', concelho: 'Trofa', consumoGas: 'Not Available', distrito: 'Porto', gwh: {'2025':0.0, '2030':0.0, '2035':0.0, '2040':7.008, '2045':9.1104, '2050':10.7923} },
    { dso: 'Portgás', concelho: 'Valença', consumoGas: 'Not Available', distrito: 'Viana do Castelo', gwh: {'2025':11.2128, '2030':22.4256, '2035':31.9565, '2040':44.8512, '2045':50.4576, '2050':56.064} },
    { dso: 'Portgás', concelho: 'Viana do Castelo', consumoGas: 'Not Available', distrito: 'Viana do Castelo', gwh: {'2025':42.048, '2030':84.096, '2035':291.1023, '2040':467.9066, '2045':660.196, '2050':783.9793} },
    { dso: 'Portgás', concelho: 'Vila Nova de Famalicão', consumoGas: 'Not Available', distrito: 'Braga', gwh: {'2025':0.0, '2030':0.0, '2035':0.0, '2040':0.0, '2045':0.0, '2050':10.7923} },
    { dso: 'Portgás', concelho: 'Vila Nova de Gaia', consumoGas: 'Not Available', distrito: 'Porto', gwh: {'2025':1.6298, '2030':3.2595, '2035':4.8893, '2040':6.5191, '2045':7.334, '2050':8.1488} },
    { dso: 'Setgás', concelho: 'Seixal', consumoGas: 'Sim', distrito: 'Setúbal', gwh: {'2025':0.0013, '2030':0.1221, '2035':0.2429, '2040':0.3637, '2045':0.4241, '2050':0.4845} },
    { dso: 'Setgás', concelho: 'Moita', consumoGas: 'Sim', distrito: 'Setúbal', gwh: {'2025':35.04, '2030':70.08, '2035':99.864, '2040':140.16, '2045':157.68, '2050':175.2} },
    { dso: 'Setgás', concelho: 'Sesimbra', consumoGas: 'Sim', distrito: 'Setúbal', gwh: {'2025':0.337, '2030':0.7497, '2035':1.4911, '2040':2.2326, '2045':2.6033, '2050':2.974} },
    { dso: 'Setgás', concelho: 'Setúbal', consumoGas: 'Sim', distrito: 'Setúbal', gwh: {'2025':1.5703, '2030':1.5878, '2035':146.995, '2040':465.659, '2045':845.4537, '2050':1075.1242} },
    { dso: 'Setgás', concelho: 'Alcochete', consumoGas: 'Sim', distrito: 'Setúbal', gwh: {'2025':0.0, '2030':0.0, '2035':0.0, '2040':6.6067, '2045':8.7091, '2050':10.391} },
    { dso: 'Setgás', concelho: 'Almada', consumoGas: 'Sim', distrito: 'Setúbal', gwh: {'2025':17.1392, '2030':29.4574, '2035':103.011, '2040':137.3198, '2045':176.5494, '2050':208.4206} },
    { dso: 'Setgás', concelho: 'Montijo', consumoGas: 'Sim', distrito: 'Setúbal', gwh: {'2025':0.0, '2030':0.0, '2035':0.0, '2040':5.3025, '2045':33.427, '2050':44.8764} },
    { dso: 'Setgás', concelho: 'Barreiro', consumoGas: 'Sim', distrito: 'Setúbal', gwh: {'2025':1.5526, '2030':1.5699, '2035':3.1225, '2040':4.6751, '2045':5.4514, '2050':6.2277} },
    { dso: 'Setgás', concelho: 'Benavente', consumoGas: 'Sim', distrito: 'Santarém', gwh: {'2025':1.3087, '2030':6.1155, '2035':29.6624, '2040':39.7539, '2045':52.3683, '2050':77.923} },
    { dso: 'Setgás', concelho: 'Palmela', consumoGas: 'Sim', distrito: 'Setúbal', gwh: {'2025':0.0, '2030':0.0, '2035':0.0, '2040':0.0, '2045':0.0, '2050':5.2213} },
    { dso: 'Setgás - Potential', concelho: 'Alcácer do Sal', consumoGas: 'Not Available', distrito: 'Setúbal', gwh: {'2025':0.0, '2030':0.0, '2035':0.0, '2040':0.0, '2045':0.0, '2050':10.7923} },
    { dso: 'Setgás - Potential', concelho: 'Grândola', consumoGas: 'Not Available', distrito: 'Setúbal', gwh: {'2025':0.0, '2030':0.0, '2035':0.0, '2040':0.0, '2045':0.0, '2050':10.7923} },
    { dso: 'Setgás - Potential', concelho: 'Santiago do Cacém', consumoGas: 'Not Available', distrito: 'Setúbal', gwh: {'2025':10.8624, '2030':21.7248, '2035':75.8966, '2040':107.2224, '2045':138.408, '2050':168.8928} },
    { dso: 'Sonorgás', concelho: 'Boticas', consumoGas: 'Not Available', distrito: 'Vila Real', gwh: {'2025':12.6144, '2030':25.2288, '2035':35.951, '2040':50.4576, '2045':56.7648, '2050':63.072} },
    { dso: 'Sonorgás', concelho: 'Celorico de Basto', consumoGas: 'Not Available', distrito: 'Braga', gwh: {'2025':29.4336, '2030':58.8672, '2035':83.8858, '2040':117.7344, '2045':132.4512, '2050':147.168} },
    { dso: 'Sonorgás', concelho: 'Póvoa de Lanhoso', consumoGas: 'Not Available', distrito: 'Braga', gwh: {'2025':15.4176, '2030':30.8352, '2035':43.9402, '2040':61.6704, '2045':69.3792, '2050':77.088} },
    { dso: 'Sonorgás', concelho: 'Valpaços', consumoGas: 'Not Available', distrito: 'Vila Real', gwh: {'2025':0.0, '2030':0.0, '2035':0.0, '2040':7.008, '2045':9.1104, '2050':10.7923} },
    { dso: 'Sonorgás', concelho: 'Vila Flor', consumoGas: 'Not Available', distrito: 'Bragança', gwh: {'2025':14.016, '2030':28.032, '2035':39.9456, '2040':56.064, '2045':63.072, '2050':70.08} },
    { dso: 'Tagusgás', concelho: 'Abrantes', consumoGas: 'Sim', distrito: 'Santarém', gwh: {'2025':1.5909, '2030':1.8542, '2035':3.6879, '2040':12.5297, '2045':15.549, '2050':28.5956} },
    { dso: 'Tagusgás', concelho: 'Almeirim', consumoGas: 'Sim', distrito: 'Santarém', gwh: {'2025':2.8032, '2030':7.6101, '2035':17.8417, '2040':24.4293, '2045':30.0357, '2050':39.9998} },
    { dso: 'Tagusgás', concelho: 'Alpiarça', consumoGas: 'Sim', distrito: 'Santarém', gwh: {'2025':0.5677, '2030':1.9693, '2035':17.8073, '2040':23.6941, '2045':31.0525, '2050':42.1945} },
    { dso: 'Tagusgás', concelho: 'Sousel', consumoGas: 'Não', distrito: 'Portalegre', gwh: {'2025':0.0, '2030':0.0, '2035':0.0, '2040':0.0, '2045':0.0, '2050':5.3962} },
    { dso: 'Tagusgás', concelho: 'Ferreira do Zêzere', consumoGas: 'Não', distrito: 'Santarém', gwh: {'2025':4.2048, '2030':8.4096, '2035':39.9456, '2040':59.568, '2045':86.5488, '2050':102.527} },
    { dso: 'Tagusgás', concelho: 'Tomar', consumoGas: 'Sim', distrito: 'Santarém', gwh: {'2025':0.7339, '2030':2.3458, '2035':18.8712, '2040':25.2625, '2045':33.2516, '2050':55.246} },
    { dso: 'Tagusgás', concelho: 'Torres Novas', consumoGas: 'Sim', distrito: 'Santarém', gwh: {'2025':3.8544, '2030':7.7088, '2035':29.2934, '2040':38.544, '2045':50.1072, '2050':59.3578} },
    { dso: 'Tagusgás', concelho: 'Ponte de Sor', consumoGas: 'Sim', distrito: 'Portalegre', gwh: {'2025':1.3683, '2030':4.1715, '2035':19.8694, '2040':26.5971, '2045':35.0067, '2050':41.7344} },
    { dso: 'Tagusgás', concelho: 'Ourém', consumoGas: 'Sim', distrito: 'Santarém', gwh: {'2025':1.0388, '2030':3.1412, '2035':24.4189, '2040':51.7311, '2045':83.7141, '2050':104.9451} },
    { dso: 'Tagusgás', concelho: 'Cartaxo', consumoGas: 'Sim', distrito: 'Santarém', gwh: {'2025':0.0, '2030':0.0, '2035':0.0, '2040':0.0, '2045':0.0, '2050':8.7559} },
    { dso: 'Tagusgás', concelho: 'Chamusca', consumoGas: 'Sim', distrito: 'Santarém', gwh: {'2025':1.4016, '2030':2.8032, '2035':3.9946, '2040':5.6064, '2045':6.3072, '2050':7.008} },
    { dso: 'Tagusgás', concelho: 'Santarém', consumoGas: 'Sim', distrito: 'Santarém', gwh: {'2025':2.5277, '2030':7.7837, '2035':46.887, '2040':134.3428, '2045':247.2686, '2050':328.4049} },
    { dso: 'Tagusgás', concelho: 'Constância', consumoGas: 'Sim', distrito: 'Santarém', gwh: {'2025':0.0, '2030':0.0, '2035':51.3796, '2040':89.9144, '2045':141.294, '2050':172.1218} },
    { dso: 'Tagusgás', concelho: 'Coruche', consumoGas: 'Sim', distrito: 'Santarém', gwh: {'2025':0.0, '2030':0.0, '2035':7.3515, '2040':9.8744, '2045':13.028, '2050':17.8864} },
  ];

  // Aggregated supply by district (GWh renewable biomethane).
  var DISTRICT_SUPPLY = {
    'Aveiro': {'2025':274.0022, '2030':652.9658, '2035':1021.5288, '2040':1320.4044, '2045':1493.9828, '2050':1642.1134},
    'Beja': {'2025':31.1856, '2030':62.3712, '2035':241.0052, '2040':331.4784, '2045':429.9408, '2050':535.8318},
    'Braga': {'2025':44.8512, '2030':91.8048, '2035':135.8151, '2040':196.9248, '2045':224.6064, '2050':278.2176},
    'Bragança': {'2025':14.016, '2030':28.032, '2035':39.9456, '2040':56.064, '2045':63.072, '2050':70.08},
    'Castelo Branco': {'2025':15.4323, '2030':32.1779, '2035':123.1062, '2040':196.0668, '2045':287.8739, '2050':348.5905},
    'Coimbra': {'2025':20.5147, '2030':63.2503, '2035':486.6625, '2040':990.7211, '2045':1598.4658, '2050':1983.7986},
    'Faro': {'2025':51.7718, '2030':103.5437, '2035':147.7468, '2040':207.0874, '2045':232.9733, '2050':264.0579},
    'Leiria': {'2025':7.3437, '2030':47.1597, '2035':174.1517, '2040':420.9002, '2045':681.1783, '2050':968.9364},
    'Lisboa': {'2025':299.697, '2030':765.71, '2035':1288.1967, '2040':1845.0484, '2045':2295.7947, '2050':2667.7003},
    'Portalegre': {'2025':1.3683, '2030':4.1715, '2035':19.8694, '2040':26.5971, '2045':35.0067, '2050':47.1306},
    'Porto': {'2025':54.2133, '2030':108.4265, '2035':223.6636, '2040':325.852, '2045':406.8342, '2050':474.8859},
    'Santarém': {'2025':20.0317, '2030':49.7414, '2035':291.1411, '2040':515.2506, '2045':790.525, '2050':1060.4864},
    'Setúbal': {'2025':106.7988, '2030':230.0613, '2035':576.4939, '2040':1038.9302, '2045':1546.5348, '2050':1902.346},
    'Viana do Castelo': {'2025':53.2608, '2030':106.5216, '2035':323.0588, '2040':512.7578, '2045':710.6536, '2050':840.0433},
    'Vila Real': {'2025':22.4256, '2030':44.8512, '2035':63.9129, '2040':96.7104, '2045':110.0256, '2050':128.2078},
    'Viseu': {'2025':26.1029, '2030':57.2885, '2035':162.3494, '2040':249.1397, '2045':340.1145, '2050':425.9994},
    'Évora': {'2025':1.4173, '2030':4.2294, '2035':6.8312, '2040':30.8776, '2045':38.5908, '2050':99.0044},
  };

  window.BIO = {
    GWH_PER_NM3: GWH_PER_NM3,
    KWH_PER_M3_CH4: KWH_PER_M3_CH4,
    AXES: AXES,
    AXIS_ORDER: ['RSU', 'AGRO', 'ETAR'],
    FS_GROUPS: FS_GROUPS,
    FEEDSTOCKS: FEEDSTOCKS,
    feedstockById: feedstockById,
    feedstockBiogasM3: feedstockBiogasM3,
    feedstockMwh: feedstockMwh,
    feedstockGwh: feedstockGwh,
    NUT2: NUT2,
    DISTRICTS: DISTRICTS,
    CENTROID: CENTROID,
    SOURCES: SOURCES,
    SUPPLY_TIMELINE: SUPPLY_TIMELINE,
    DISTRICT_SUPPLY: DISTRICT_SUPPLY,
    gwhOf: gwhOf,
    // YlGn ramp stops chosen by the user for the choropleth.
    RAMP: ['#ffffe5', '#d9f0a3', '#78c679', '#41ab5d', '#238443', '#005a32'],
    updated: '29/06/2026'
  };
})();
