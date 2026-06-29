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

  // Base feedstock records — one pin each. id is stable for de-dupe / removal.
  var SEED = [
    // RSU
    { axis: 'RSU', distrito: 'Lisboa', local: 'Lisboa', lat: 38.7223, lon: -9.1393, inputs: { residuosUrbanos: 212000, fracaoOrganicaPct: 35 }, fonte: 'INE 2021' },
    { axis: 'RSU', distrito: 'Porto', local: 'Porto', lat: 41.1579, lon: -8.6291, inputs: { residuosUrbanos: 95000, fracaoOrganicaPct: 33 }, fonte: 'INE 2021' },
    { axis: 'RSU', distrito: 'Coimbra', local: 'Coimbra', lat: 40.2033, lon: -8.4103, inputs: { residuosUrbanos: 55000, fracaoOrganicaPct: 32 }, fonte: 'INE 2021' },
    { axis: 'RSU', distrito: 'Setúbal', local: 'Setúbal', lat: 38.5244, lon: -8.8957, inputs: { residuosUrbanos: 36000, fracaoOrganicaPct: 34 }, fonte: 'GPP 2022' },
    { axis: 'RSU', distrito: 'Faro', local: 'Faro', lat: 37.0194, lon: -7.9322, inputs: { residuosUrbanos: 24000, fracaoOrganicaPct: 30 }, fonte: 'INE 2021' },
    // Agropecuário e Florestal
    { axis: 'AGRO', distrito: 'Coimbra', local: 'Coimbra', lat: 40.2033, lon: -8.4103, inputs: { residuosAgro: 18000, residuosFlorestais: 5000 }, fonte: 'APA RARU 2022' },
    { axis: 'AGRO', distrito: 'Évora', local: 'Évora', lat: 38.5667, lon: -7.9000, inputs: { residuosAgro: 35000, residuosFlorestais: 8000 }, fonte: 'APA RARU 2022' },
    { axis: 'AGRO', distrito: 'Braga', local: 'Barcelos', lat: 41.5367, lon: -8.6180, inputs: { residuosAgro: 42000, residuosFlorestais: 3000 }, fonte: 'SRIR 2022' },
    { axis: 'AGRO', distrito: 'Santarém', local: 'Santarém', lat: 39.2369, lon: -8.6881, inputs: { residuosAgro: 26000, residuosFlorestais: 6500 }, fonte: 'GPP 2022' },
    { axis: 'AGRO', distrito: 'Braga', local: 'Braga', lat: 41.5518, lon: -8.4229, inputs: { residuosAgro: 15000, residuosFlorestais: 2000 }, fonte: 'APA RARU 2022' },
    // ETAR
    { axis: 'ETAR', distrito: 'Lisboa', local: 'ETAR Beirolas', lat: 38.7723, lon: -9.0893, inputs: { lamas: 12000 }, fonte: 'Águas de Lisboa' },
    { axis: 'ETAR', distrito: 'Porto', local: 'ETAR Sul', lat: 41.1100, lon: -8.6400, inputs: { lamas: 6800 }, fonte: 'Águas do Porto' },
    { axis: 'ETAR', distrito: 'Coimbra', local: 'ETAR Coimbra', lat: 40.1850, lon: -8.4200, inputs: { lamas: 3500 }, fonte: 'AdP — Águas do Centro' },
    { axis: 'ETAR', distrito: 'Aveiro', local: 'ETAR Cacia', lat: 40.6900, lon: -8.5700, inputs: { lamas: 2800 }, fonte: 'Águas do Centro Litoral' },
    { axis: 'ETAR', distrito: 'Faro', local: 'ETAR Faro/Olhão', lat: 37.0150, lon: -7.9000, inputs: { lamas: 2200 }, fonte: 'ERSAR RASARP 2022' }
  ];

  // Materialise seed records: add id + computed gwh.
  var SOURCES = SEED.map(function (s, i) {
    return {
      id: 'seed-' + i,
      axis: s.axis, distrito: s.distrito, local: s.local,
      lat: s.lat, lon: s.lon, inputs: s.inputs,
      gwh: gwhOf(s.axis, s.inputs),
      fonte: s.fonte, origin: 'base'
    };
  });

  /* ----------------------------------------------------------------------
     FEEDSTOCK TAXONOMY + CONVERSION — Simulador BioCH4 Floene/Biowatt
     ----------------------------------------------------------------------
     Cadeia (igual ao simulador):  t/ano → biogás (m³/ano) → biometano (MWh/ano)
       biogás   = toneladas × rendimento específico (m³ biogás / t)
       biometano(MWh) = biogás × %CH4 × 9,97 kWh/m³ ÷ 1000

     Calibração: o CSV do simulador expõe um único cenário —
       20 000 t de fração orgânica de RSU → 217 989 m³ biogás → 1493,31 MWh.
     A constante CALIB ajusta os rendimentos de literatura (KTBL/FNR, IEA
     Bioenergy) a essa eficiência de processo, reproduzindo o cenário exacto.
     Os restantes feedstocks usam rendimentos documentados × CALIB; os valores
     podem ser substituídos pela tabela interna do simulador quando disponível. */
  var KWH_PER_M3_CH4 = 9.97;       // PCI do metano
  var CALIB = 0.0991;              // ≈ 10,90 / 110  (ancorado ao cenário OFMSW do simulador)

  // group → eixo do mapa (RSU / AGRO / ETAR) + unidade de entrada
  var FS_GROUPS = [
    { id: 'PEC',  axis: 'AGRO', label: 'Pecuária — efluentes',          unit: 't/ano' },
    { id: 'AGRIC',axis: 'AGRO', label: 'Culturas agrícolas — resíduos', unit: 't/ano' },
    { id: 'AGRIND',axis:'AGRO', label: 'Agroindustrial — resíduos',     unit: 't/ano' },
    { id: 'RSU',  axis: 'RSU',  label: 'Resíduos urbanos (RSU)',        unit: 't/ano' },
    { id: 'ETAR', axis: 'ETAR', label: 'ETAR — lamas',                  unit: 't MS/ano' }
  ];

  // litM3 = rendimento de biogás de literatura (m³ / t matéria fresca); ch4 = fração de metano.
  // m3PerTon (opcional) = rendimento final já fixado, sem aplicar CALIB (usado nas lamas de ETAR, base seca).
  var FEEDSTOCKS_RAW = [
    // ---- Pecuária (Livestock) ----
    { id: 'bov_leite',   group: 'PEC', label: 'Bovinos — leite / criação',        litM3: 25,  ch4: 0.55 },
    { id: 'bov_engorda', group: 'PEC', label: 'Bovinos — engorda',                litM3: 28,  ch4: 0.55 },
    { id: 'suinos',      group: 'PEC', label: 'Suínos',                           litM3: 28,  ch4: 0.60 },
    { id: 'aves_galin',  group: 'PEC', label: 'Aves — galinhas / poedeiras',      litM3: 80,  ch4: 0.60 },
    { id: 'aves_patos',  group: 'PEC', label: 'Aves — patos',                     litM3: 70,  ch4: 0.60 },
    { id: 'aves_perus',  group: 'PEC', label: 'Aves — perus',                     litM3: 75,  ch4: 0.60 },
    { id: 'equinos',     group: 'PEC', label: 'Equídeos',                         litM3: 22,  ch4: 0.55 },
    { id: 'ovinos',      group: 'PEC', label: 'Ovinos',                           litM3: 30,  ch4: 0.55 },
    { id: 'caprinos',    group: 'PEC', label: 'Caprinos',                         litM3: 30,  ch4: 0.55 },
    // ---- Culturas agrícolas (Agricultural Crops) ----
    { id: 'palha_cer',   group: 'AGRIC', label: 'Palha de cereais de inverno',    litM3: 250, ch4: 0.53 },
    { id: 'palha_milho', group: 'AGRIC', label: 'Palha de milho',                 litM3: 220, ch4: 0.53 },
    { id: 'palha_arroz', group: 'AGRIC', label: 'Palha de arroz',                 litM3: 200, ch4: 0.53 },
    { id: 'palha_sorgo', group: 'AGRIC', label: 'Palha de sorgo',                 litM3: 210, ch4: 0.53 },
    { id: 'vinicola',    group: 'AGRIC', label: 'Subprodutos vinícolas (engaço e borras)', litM3: 260, ch4: 0.55 },
    // ---- Agroindustrial (Agroindustrial Waste) ----
    { id: 'carne_peixe', group: 'AGRIND', label: 'Indústria de carne e pescado',  litM3: 120, ch4: 0.62 },
    { id: 'soro',        group: 'AGRIND', label: 'Lacticínios — soro de leite',   litM3: 55,  ch4: 0.58 },
    { id: 'lamas_lact',  group: 'AGRIND', label: 'Lacticínios — lamas',           litM3: 50,  ch4: 0.60 },
    { id: 'lact_outros', group: 'AGRIND', label: 'Lacticínios — outras matérias', litM3: 60,  ch4: 0.58 },
    { id: 'bagaco_azt',  group: 'AGRIND', label: 'Azeite — bagaço de azeitona',   litM3: 100, ch4: 0.55 },
    { id: 'aguas_rucas', group: 'AGRIND', label: 'Azeite — águas russas',         litM3: 35,  ch4: 0.60 },
    { id: 'dreche',      group: 'AGRIND', label: 'Bebidas — dreche cervejeira',   litM3: 120, ch4: 0.58 },
    { id: 'sidra',       group: 'AGRIND', label: 'Bebidas — matérias da sidra',   litM3: 90,  ch4: 0.58 },
    { id: 'citrinos',    group: 'AGRIND', label: 'Frutas/hortícolas — citrinos',  litM3: 80,  ch4: 0.58 },
    { id: 'frutos_nc',   group: 'AGRIND', label: 'Frutas/hortícolas — frutos não-citrinos', litM3: 90, ch4: 0.58 },
    { id: 'horticolas',  group: 'AGRIND', label: 'Frutas/hortícolas — produtos hortícolas', litM3: 70, ch4: 0.58 },
    { id: 'tuberculos',  group: 'AGRIND', label: 'Frutas/hortícolas — tubérculos', litM3: 95, ch4: 0.58 },
    { id: 'transf_citr', group: 'AGRIND', label: 'Transformação — citrinos',      litM3: 85,  ch4: 0.58 },
    { id: 'transf_frut', group: 'AGRIND', label: 'Transformação — frutos',        litM3: 90,  ch4: 0.58 },
    { id: 'transf_hort', group: 'AGRIND', label: 'Transformação — hortícolas',    litM3: 75,  ch4: 0.58 },
    { id: 'transf_tub',  group: 'AGRIND', label: 'Transformação — tubérculos',    litM3: 95,  ch4: 0.58 },
    { id: 'lamas_veg',   group: 'AGRIND', label: 'Lamas de processamento vegetal',litM3: 55,  ch4: 0.60 },
    { id: 'glicerina',   group: 'AGRIND', label: 'Glicerina',                     litM3: 420, ch4: 0.60 },
    // ---- Resíduos urbanos (Urban Wastes) — ÂNCORA do simulador ----
    { id: 'ofmsw',       group: 'RSU', label: 'Fração orgânica de RSU',           litM3: 110, ch4: 0.687 },
    // ---- ETAR (mantido do dataset Floene; base seca, 300 Nm³/t MS) ----
    { id: 'lamas_etar',  group: 'ETAR', label: 'Lamas de ETAR',                   m3PerTon: 300, ch4: 0.55 }
  ];

  function fsYield(f) { return f.m3PerTon != null ? f.m3PerTon : f.litM3 * CALIB; } // m³ biogás / t
  var GROUP_BY_ID = {}; FS_GROUPS.forEach(function (g) { GROUP_BY_ID[g.id] = g; });

  var FEEDSTOCKS = FEEDSTOCKS_RAW.map(function (f) {
    var g = GROUP_BY_ID[f.group];
    var m3 = fsYield(f);
    return {
      id: f.id, group: f.group, groupLabel: g.label, axis: g.axis, unit: g.unit,
      label: f.label, m3PerTon: m3, ch4: f.ch4,
      mwhPerTon: m3 * f.ch4 * KWH_PER_M3_CH4 / 1000   // MWh biometano / t
    };
  });
  var FS_INDEX = {}; FEEDSTOCKS.forEach(function (f) { FS_INDEX[f.id] = f; });

  function feedstockById(id) { return FS_INDEX[id]; }
  function feedstockBiogasM3(id, tons) { var f = FS_INDEX[id]; return f ? (Number(tons) || 0) * f.m3PerTon : 0; }
  function feedstockMwh(id, tons) { var f = FS_INDEX[id]; return f ? (Number(tons) || 0) * f.mwhPerTon : 0; }
  function feedstockGwh(id, tons) { return feedstockMwh(id, tons) / 1000; }

  window.BIO = {
    GWH_PER_NM3: GWH_PER_NM3,
    KWH_PER_M3_CH4: KWH_PER_M3_CH4,
    CALIB: CALIB,
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
    gwhOf: gwhOf,
    // YlGn ramp stops chosen by the user for the choropleth.
    RAMP: ['#ffffe5', '#d9f0a3', '#78c679', '#41ab5d', '#238443', '#005a32'],
    updated: '20/04/2026'
  };
})();
