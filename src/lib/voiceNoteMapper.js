import { DEMO_FIELDS } from './demolitionStages';
import { RG_FIELDS } from './roughGradingStages';
import { SM_STAGES } from './siteManagementStages';

const s = (v) => (v != null && v !== '') ? String(v) : '';

/**
 * Map AI-extracted data to a Demolition & Removals entry with auto-flagging.
 */
export function mapDemolitionEntry(op) {
  const sub = op.demo_sub_type || '';
  const group = op.demo_group || '';
  const cfg = DEMO_FIELDS[sub];
  if (!cfg || !sub) return null;

  const f = op.demo_fields || {};
  const flags = [], flagLabels = {};
  const addFlag = (k, l) => { flags.push(k); flagLabels[k] = l; };
  const v = (key) => s(f[key] ?? op[key]);

  const sfLen = v('sf_length') || s(op.sf_length);
  const sfWid = v('sf_width') || s(op.sf_width);
  const sf = sfLen && sfWid ? String(Math.round(parseFloat(sfLen) * parseFloat(sfWid))) : '';

  const entry = { group, sub_type: sub };

  if (cfg.hasSFCalc) {
    Object.assign(entry, { sf_length: sfLen, sf_width: sfWid, sf });
    if (!sf) addFlag('sf', 'Square Footage');
  }
  if (cfg.hasCYCalc) {
    entry.depth_inches = v('depth_inches') || s(op.depth_inches);
  }

  // First pass: set all field values from AI
  const allFields = [...cfg.measurements, ...cfg.details];
  for (const field of allFields) {
    entry[field.key] = v(field.key);
  }

  // Second pass: flag missing fields where condition is met
  for (const field of allFields) {
    if (!entry[field.key]) {
      const condMet = !field.condition || entry[field.condition.key] === field.condition.value;
      if (condMet) addFlag(field.key, field.label);
    }
  }

  entry.notes = v('notes') || '';
  if (flags.length > 0) { entry._flags = flags; entry._flag_labels = flagLabels; }
  return entry;
}

/**
 * Map AI-extracted data to a Boulders/Accents & Structures entry with auto-flagging.
 */
export function mapBouldersEntry(op) {
  const type = op.boulders_type || '';
  if (!type) return null;

  const f = op.boulders_fields || {};
  const flags = [], flagLabels = {};
  const addFlag = (k, l) => { flags.push(k); flagLabels[k] = l; };
  const v = (key) => s(f[key] ?? op[key]);

  const entry = { sub_type: type, time_estimate: v('time_estimate'), notes: v('notes') };
  if (!entry.time_estimate) addFlag('time_estimate', 'Time Estimate (hrs)');

  if (type === 'Boulders / Accents') {
    entry.count_24_30 = v('count_24_30');
    entry.count_18_24 = v('count_18_24');
    entry.count_12_18 = v('count_12_18');
    entry.color_preference = v('color_preference');
    entry.ball_cart_needed = v('ball_cart_needed');
    entry.dump_trailer_needed = v('dump_trailer_needed');
    entry.machine_access = v('machine_access');
    entry.delivery_supplier = v('delivery_supplier');
    entry.delivery_special_order = v('delivery_special_order');
    entry.constraints = v('constraints');
    if (!entry.count_24_30 && !entry.count_18_24 && !entry.count_12_18) addFlag('count_24_30', 'Boulder counts');
    if (!entry.color_preference) addFlag('color_preference', 'Color Preference');
    if (!entry.ball_cart_needed) addFlag('ball_cart_needed', 'Ball Cart Needed?');
    if (!entry.dump_trailer_needed) addFlag('dump_trailer_needed', 'Dump Trailer Needed?');
    if (!entry.machine_access) addFlag('machine_access', 'Machine Access');
    if (!entry.delivery_supplier) addFlag('delivery_supplier', 'Supplier');
  } else if (type === 'Structures - Fence') {
    entry.lf = v('lf');
    entry.height = v('height');
    entry.gate_count = v('gate_count');
    entry.gate_width = v('gate_width');
    entry.fence_cedar_2x2 = v('fence_cedar_2x2');
    entry.fence_cedar_4x4 = v('fence_cedar_4x4');
    entry.fence_fasteners = v('fence_fasteners');
    entry.post_spacing = v('post_spacing');
    entry.fence_dig_mode = v('fence_dig_mode');
    entry.fence_dig_hours = v('fence_dig_hours');
    entry.fence_machine_type = v('fence_machine_type');
    if (!entry.lf) addFlag('lf', 'Linear Feet');
    if (!entry.height) addFlag('height', 'Height (ft)');
    if (!entry.post_spacing) addFlag('post_spacing', 'Post Spacing (ft)');
    if (!entry.fence_dig_mode) addFlag('fence_dig_mode', 'Hand or Machine');
    if (!entry.fence_dig_hours) addFlag('fence_dig_hours', 'Dig Post Holes (hrs)');
    if (entry.fence_dig_mode === 'Machine' && !entry.fence_machine_type) addFlag('fence_machine_type', 'Machine Type');
  } else if (type === 'Structures - Arbor') {
    entry.count = v('count');
    entry.length = v('length');
    entry.height = v('height');
    entry.width = v('width');
    entry.footing = v('footing');
    entry.material = v('material');
    entry.arbor_dig_mode = v('arbor_dig_mode');
    entry.arbor_dig_hours = v('arbor_dig_hours');
    entry.arbor_machine_type = v('arbor_machine_type');
    entry.needs_level_pad = v('needs_level_pad');
    entry.remove_count = v('remove_count');
    if (!entry.count) addFlag('count', 'Count');
    if (!entry.material) addFlag('material', 'Material');
    if (!entry.arbor_dig_mode) addFlag('arbor_dig_mode', 'Hand or Machine');
    if (entry.arbor_dig_mode === 'Machine' && !entry.arbor_machine_type) addFlag('arbor_machine_type', 'Machine Type');
    if (!entry.needs_level_pad) addFlag('needs_level_pad', 'Needs Level Pad?');
  } else if (type === 'Raised Garden Bed') {
    entry.material = v('material');
    entry.quantity = v('quantity');
    entry.length = v('length');
    entry.width = v('width');
    entry.soil_depth = v('soil_depth');
    entry.base_level = v('base_level');
    entry.machine_access = v('machine_access');
    if (!entry.material) addFlag('material', 'Material');
    if (!entry.quantity) addFlag('quantity', 'Quantity');
    if (!entry.length) addFlag('length', 'Length (ft)');
    if (!entry.width) addFlag('width', 'Width (ft)');
    if (!entry.soil_depth) addFlag('soil_depth', 'Soil Depth (in)');
    if (!entry.base_level) addFlag('base_level', 'Base Level?');
    if (!entry.machine_access) addFlag('machine_access', 'Machine Access');
  }

  if (flags.length > 0) { entry._flags = flags; entry._flag_labels = flagLabels; }
  return entry;
}

/**
 * Map AI-extracted data to a Drainage entry with auto-flagging.
 */
export function mapDrainageEntry(op) {
  const type = op.drain_type || '';
  if (!type) return null;

  const f = op.drainage_fields || {};
  const flags = [], flagLabels = {};
  const addFlag = (k, l) => { flags.push(k); flagLabels[k] = l; };
  const v = (key) => s(f[key] ?? op[key]);

  const entry = { drain_type: type, sub_type: type, time_estimate: v('time_estimate'), notes: v('notes') };
  if (!entry.time_estimate) addFlag('time_estimate', 'Time Estimate (hrs)');

  const isMembrane = type === 'Impervious Membrane';
  const pipeTypes = ['Buried Downspout', 'Buried Drain', 'Buried Sump Line'];
  const filterTypes = ['Curtain Drain', 'French Drain'];

  if (!isMembrane) {
    entry.lf = v('lf');
    if (!entry.lf) addFlag('lf', 'Linear Feet (LF)');

    entry.excavation_mode = v('excavation_mode');
    if (!entry.excavation_mode) addFlag('excavation_mode', 'Excavation Method');
    if (entry.excavation_mode === 'Machine') {
      entry.excavation_machine_type = v('excavation_machine_type');
      if (!entry.excavation_machine_type) addFlag('excavation_machine_type', 'Machine Type');
    }
    entry.trencher_attachment = v('trencher_attachment');
    if (!entry.trencher_attachment) addFlag('trencher_attachment', 'Trencher/Excavator Attachment?');
    entry.excavation_depth = v('excavation_depth');
    if (!entry.excavation_depth) addFlag('excavation_depth', 'Excavation Depth (in)');
    entry.soil_composition = f.soil_composition || op.soil_composition || [];
    if (!entry.soil_composition.length) addFlag('soil_composition', 'Soil Type');
    entry.spoil_type = v('spoil_type');
    if (!entry.spoil_type) addFlag('spoil_type', 'Spoil Disposal');
    if (entry.spoil_type === 'Hauled off') {
      entry.disposal_site = v('disposal_site');
      if (!entry.disposal_site) addFlag('disposal_site', 'Disposal Site');
    }
    entry.sod_removal = v('sod_removal');
    if (!entry.sod_removal) addFlag('sod_removal', 'Sod Removal?');
    if (type === 'Curtain Drain' && entry.sod_removal === 'Yes') {
      entry.sod_disposal_method = v('sod_disposal_method');
      if (!entry.sod_disposal_method) addFlag('sod_disposal_method', 'Sod Disposal Method');
    }
    entry.obstruction_hours = v('obstruction_hours');
    if (!entry.obstruction_hours) addFlag('obstruction_hours', 'Obstruction Time (hrs)');
    entry.zip_level = v('zip_level');
    if (!entry.zip_level) addFlag('zip_level', 'Zip Level Needed?');
  }

  if ([...pipeTypes, ...filterTypes].includes(type)) {
    entry.pipe_size = v('pipe_size');
    if (!entry.pipe_size) addFlag('pipe_size', 'Pipe Size (in)');
  }

  if (['Buried Downspout', 'Buried Sump Line', 'Dry Stream Bed'].includes(type)) {
    entry.existing_downspout = v('existing_downspout');
    if (!entry.existing_downspout) addFlag('existing_downspout', 'Existing Downspout?');
    if (entry.existing_downspout === 'Yes') {
      entry.existing_lf = v('existing_lf');
      if (!entry.existing_lf) addFlag('existing_lf', 'Existing LF');
    }
  }
  if (filterTypes.includes(type)) {
    entry.existing_drain = v('existing_drain');
    if (!entry.existing_drain) addFlag('existing_drain', 'Existing Drain?');
    if (entry.existing_drain === 'Yes') {
      entry.existing_lf = v('existing_lf');
      if (!entry.existing_lf) addFlag('existing_lf', 'Existing LF');
    }
  }

  if (type === 'Dry Stream Bed') {
    entry.width = v('width');
    if (!entry.width) addFlag('width', 'Width (ft)');
    entry.stream_depth = v('stream_depth');
    if (!entry.stream_depth) addFlag('stream_depth', 'Depth (in)');
    entry.ball_cart_needed = v('ball_cart_needed');
    if (!entry.ball_cart_needed) addFlag('ball_cart_needed', 'Ball Cart Needed?');
    entry.boulders_needed = v('boulders_needed');
    if (!entry.boulders_needed) addFlag('boulders_needed', 'Boulders Needed?');
    if (entry.boulders_needed === 'Yes') {
      entry.fieldstone_10_18 = v('fieldstone_10_18');
      entry.fieldstone_18_24 = v('fieldstone_18_24');
      entry.fieldstone_24_30 = v('fieldstone_24_30');
      if (!entry.fieldstone_10_18 && !entry.fieldstone_18_24 && !entry.fieldstone_24_30) addFlag('fieldstone_10_18', 'Fieldstone Counts');
    }
    entry.drainage_rock_needed = v('drainage_rock_needed');
    if (!entry.drainage_rock_needed) addFlag('drainage_rock_needed', 'Drainage Rock Needed?');
    if (entry.drainage_rock_needed === 'Yes') {
      entry.drainage_rock_cy = v('drainage_rock_cy');
      if (!entry.drainage_rock_cy) addFlag('drainage_rock_cy', 'Drainage Rock CY');
    }
    entry.stone_type = v('stone_type');
    if (!entry.stone_type) addFlag('stone_type', 'Stone Type');
    entry.stream_purpose = v('stream_purpose');
    if (!entry.stream_purpose) addFlag('stream_purpose', 'Decorative vs Functional?');
  }

  if (pipeTypes.includes(type)) {
    entry.pvc_supplies_needed = v('pvc_supplies_needed');
    if (!entry.pvc_supplies_needed) addFlag('pvc_supplies_needed', 'PVC Glue/Primer/Supplies?');
    if (entry.pvc_supplies_needed === 'Yes') {
      entry.pvc_supplies_count = v('pvc_supplies_count');
      if (!entry.pvc_supplies_count) addFlag('pvc_supplies_count', 'PVC Supplies Count');
    }
    entry.pvc_fittings_needed = v('pvc_fittings_needed');
    if (!entry.pvc_fittings_needed) addFlag('pvc_fittings_needed', 'PVC Fittings Needed?');
    if (entry.pvc_fittings_needed === 'Yes') {
      ['fit_90_long_turn', 'fit_90_tight', 'fit_22_5_elbow', 'fit_hub_45_elbow', 'fit_tee', 'fit_wye', 'fit_cleanout'].forEach(k => { entry[k] = v(k); });
      const hasAny = ['fit_90_long_turn', 'fit_90_tight', 'fit_22_5_elbow', 'fit_hub_45_elbow', 'fit_tee', 'fit_wye', 'fit_cleanout'].some(k => entry[k]);
      if (!hasAny) addFlag('fit_90_long_turn', 'PVC Fitting Counts');
    }
  }

  if (type === 'Buried Downspout') {
    entry.downspout_connection_needed = v('downspout_connection_needed');
    if (!entry.downspout_connection_needed) addFlag('downspout_connection_needed', 'Downspout Connection Assembly?');
    if (entry.downspout_connection_needed === 'Yes') {
      entry.downspout_connection_size = v('downspout_connection_size');
      if (!entry.downspout_connection_size) addFlag('downspout_connection_size', 'Connection Size');
      entry.downspout_connection_count = v('downspout_connection_count');
      if (!entry.downspout_connection_count) addFlag('downspout_connection_count', 'Connection Count');
    }
    entry.catch_basin_needed = v('catch_basin_needed');
    if (!entry.catch_basin_needed) addFlag('catch_basin_needed', 'Catch Basin Needed?');
    if (entry.catch_basin_needed === 'Yes') {
      entry.catch_basin_size = v('catch_basin_size');
      if (!entry.catch_basin_size) addFlag('catch_basin_size', 'Catch Basin Size');
      entry.catch_basin_count = v('catch_basin_count');
      if (!entry.catch_basin_count) addFlag('catch_basin_count', 'Catch Basin Count');
    }
    entry.miter_drain = v('miter_drain');
    if (!entry.miter_drain) addFlag('miter_drain', 'Miter Drain Needed?');
    if (entry.miter_drain === 'Yes') {
      entry.miter_drain_type = v('miter_drain_type');
      if (!entry.miter_drain_type) addFlag('miter_drain_type', 'Miter Drain Type');
      entry.miter_drain_count = v('miter_drain_count');
      if (!entry.miter_drain_count) addFlag('miter_drain_count', 'Miter Drain Count');
    }
    entry.lawn_repair = v('lawn_repair');
    if (!entry.lawn_repair) addFlag('lawn_repair', 'Lawn Repair Needed?');
  }

  if (type === 'Buried Drain') {
    entry.catch_basin_needed = v('catch_basin_needed');
    if (!entry.catch_basin_needed) addFlag('catch_basin_needed', 'Catch Basin Needed?');
    if (entry.catch_basin_needed === 'Yes') {
      entry.catch_basin_size = v('catch_basin_size');
      if (!entry.catch_basin_size) addFlag('catch_basin_size', 'Catch Basin Size');
      entry.catch_basin_count = v('catch_basin_count');
      if (!entry.catch_basin_count) addFlag('catch_basin_count', 'Catch Basin Count');
    }
    entry.atrium_drain_needed = v('atrium_drain_needed');
    if (!entry.atrium_drain_needed) addFlag('atrium_drain_needed', 'Atrium Drain Needed?');
    if (entry.atrium_drain_needed === 'Yes') {
      entry.atrium_drain_count = v('atrium_drain_count');
      if (!entry.atrium_drain_count) addFlag('atrium_drain_count', 'Atrium Drain Count');
    }
    entry.miter_drain = v('miter_drain');
    if (!entry.miter_drain) addFlag('miter_drain', 'Miter Drain Needed?');
    if (entry.miter_drain === 'Yes') {
      entry.miter_drain_type = v('miter_drain_type');
      if (!entry.miter_drain_type) addFlag('miter_drain_type', 'Miter Drain Type');
      entry.miter_drain_count = v('miter_drain_count');
      if (!entry.miter_drain_count) addFlag('miter_drain_count', 'Miter Drain Count');
    }
    entry.lawn_repair = v('lawn_repair');
    if (!entry.lawn_repair) addFlag('lawn_repair', 'Lawn Repair Needed?');
  }

  if (type === 'Buried Sump Line') {
    entry.freezedrain_needed = v('freezedrain_needed');
    if (!entry.freezedrain_needed) addFlag('freezedrain_needed', 'Freezedrain Assembly?');
    if (entry.freezedrain_needed === 'Yes') {
      entry.freezedrain_count = v('freezedrain_count');
      if (!entry.freezedrain_count) addFlag('freezedrain_count', 'Freezedrain Count');
    }
    entry.miter_drain = v('miter_drain');
    if (!entry.miter_drain) addFlag('miter_drain', 'Miter Drain Needed?');
    if (entry.miter_drain === 'Yes') {
      entry.miter_drain_type = v('miter_drain_type');
      if (!entry.miter_drain_type) addFlag('miter_drain_type', 'Miter Drain Type');
      entry.miter_drain_count = v('miter_drain_count');
      if (!entry.miter_drain_count) addFlag('miter_drain_count', 'Miter Drain Count');
    }
    entry.topsoil_needed = v('topsoil_needed');
    if (!entry.topsoil_needed) addFlag('topsoil_needed', 'Topsoil/Screened Soil?');
    if (entry.topsoil_needed === 'Yes') {
      entry.topsoil_cy = v('topsoil_cy');
      if (!entry.topsoil_cy) addFlag('topsoil_cy', 'Topsoil CY');
    }
    entry.lawn_repair = v('lawn_repair');
    if (!entry.lawn_repair) addFlag('lawn_repair', 'Lawn Repair Needed?');
  }

  if (type === 'Curtain Drain') {
    entry.stone_needed = v('stone_needed');
    if (!entry.stone_needed) addFlag('stone_needed', 'Stone Needed?');
    entry.fabric_needed = v('fabric_needed');
    if (!entry.fabric_needed) addFlag('fabric_needed', 'Fabric Needed?');
    if (entry.fabric_needed === 'Yes') {
      entry.fabric_sf = v('fabric_sf');
      if (!entry.fabric_sf) addFlag('fabric_sf', 'Fabric SF');
    }
  }

  if (type === 'French Drain') {
    entry.corrugated_tile_needed = v('corrugated_tile_needed');
    if (!entry.corrugated_tile_needed) addFlag('corrugated_tile_needed', 'Corrugated Drain Tile?');
    if (entry.corrugated_tile_needed === 'Yes') {
      entry.tile_perforated_sock_count = v('tile_perforated_sock_count');
      entry.tile_solid_count = v('tile_solid_count');
      if (!entry.tile_perforated_sock_count && !entry.tile_solid_count) addFlag('tile_perforated_sock_count', 'Tile Counts');
    }
    entry.pvc_cleanout_needed = v('pvc_cleanout_needed');
    if (!entry.pvc_cleanout_needed) addFlag('pvc_cleanout_needed', 'PVC Cleanout Assembly?');
    if (entry.pvc_cleanout_needed === 'Yes') {
      entry.pvc_cleanout_count = v('pvc_cleanout_count');
      if (!entry.pvc_cleanout_count) addFlag('pvc_cleanout_count', 'Cleanout Count');
    }
    entry.misc_drainage_needed = v('misc_drainage_needed');
    if (!entry.misc_drainage_needed) addFlag('misc_drainage_needed', 'Misc Drainage Material?');
    if (entry.misc_drainage_needed === 'Yes') {
      entry.misc_drainage_notes = v('misc_drainage_notes');
      if (!entry.misc_drainage_notes) addFlag('misc_drainage_notes', 'Misc Drainage Description');
    }
    entry.coarse_sand_needed = v('coarse_sand_needed');
    if (!entry.coarse_sand_needed) addFlag('coarse_sand_needed', 'Coarse/Washed Sand?');
    if (entry.coarse_sand_needed === 'Yes') {
      entry.coarse_sand_tons = v('coarse_sand_tons');
      if (!entry.coarse_sand_tons) addFlag('coarse_sand_tons', 'Sand Tons');
    }
    entry.drainage_rock_needed = v('drainage_rock_needed');
    if (!entry.drainage_rock_needed) addFlag('drainage_rock_needed', 'Drainage Rock 1.5"?');
    if (entry.drainage_rock_needed === 'Yes') {
      entry.drainage_rock_tons = v('drainage_rock_tons');
      if (!entry.drainage_rock_tons) addFlag('drainage_rock_tons', 'Drainage Rock Tons');
    }
    entry.stone_needed = v('stone_needed');
    if (!entry.stone_needed) addFlag('stone_needed', 'Stone Needed?');
    entry.fabric_needed = v('fabric_needed');
    if (!entry.fabric_needed) addFlag('fabric_needed', 'Fabric Needed?');
    if (entry.fabric_needed === 'Yes') {
      entry.fabric_sf = v('fabric_sf');
      if (!entry.fabric_sf) addFlag('fabric_sf', 'Fabric SF');
    }
  }

  if (isMembrane) {
    entry.rough_grading_needed = v('rough_grading_needed');
    if (!entry.rough_grading_needed) addFlag('rough_grading_needed', 'Rough Grading/Excavation?');
    if (entry.rough_grading_needed === 'Yes') {
      entry.mem_length = v('mem_length');
      entry.mem_width = v('mem_width');
      entry.mem_depth = v('mem_depth');
      if (!entry.mem_length) addFlag('mem_length', 'Length (ft)');
      if (!entry.mem_width) addFlag('mem_width', 'Width (ft)');
      if (!entry.mem_depth) addFlag('mem_depth', 'Depth (in)');
      entry.excavation_mode = v('excavation_mode');
      if (!entry.excavation_mode) addFlag('excavation_mode', 'Excavation Method');
      if (entry.excavation_mode === 'Machine') {
        entry.excavation_machine_type = v('excavation_machine_type');
        if (!entry.excavation_machine_type) addFlag('excavation_machine_type', 'Machine Type');
      }
    }
    entry.detail_excavation_hours = v('detail_excavation_hours');
    if (!entry.detail_excavation_hours) addFlag('detail_excavation_hours', 'Detail Excavation (hrs)');
    entry.place_membrane_hours = v('place_membrane_hours');
    if (!entry.place_membrane_hours) addFlag('place_membrane_hours', 'Place Membrane (hrs)');
    entry.roofing_membrane_needed = v('roofing_membrane_needed');
    if (!entry.roofing_membrane_needed) addFlag('roofing_membrane_needed', 'Rubber Roofing Membrane?');
    if (entry.roofing_membrane_needed === 'Yes') {
      entry.roofing_membrane_rolls = v('roofing_membrane_rolls');
      if (!entry.roofing_membrane_rolls) addFlag('roofing_membrane_rolls', 'Membrane Rolls');
    }
    entry.woven_fabric_needed = v('woven_fabric_needed');
    if (!entry.woven_fabric_needed) addFlag('woven_fabric_needed', 'Woven Fabric w/ Pins?');
    if (entry.woven_fabric_needed === 'Yes') {
      entry.woven_fabric_sf = v('woven_fabric_sf');
      if (!entry.woven_fabric_sf) addFlag('woven_fabric_sf', 'Fabric SF');
    }
    entry.place_stone_hours = v('place_stone_hours');
    if (!entry.place_stone_hours) addFlag('place_stone_hours', 'Place Stone (hrs)');
    entry.drainage_rock_needed = v('drainage_rock_needed');
    if (!entry.drainage_rock_needed) addFlag('drainage_rock_needed', 'Drainage Rock 1.5"?');
    if (entry.drainage_rock_needed === 'Yes') {
      entry.drainage_rock_tons = v('drainage_rock_tons');
      if (!entry.drainage_rock_tons) addFlag('drainage_rock_tons', 'Drainage Rock Tons');
    }
    entry.edging_needed = v('edging_needed');
    if (!entry.edging_needed) addFlag('edging_needed', 'Edging Needed?');
    entry.poly_plastic_needed = v('poly_plastic_needed');
    if (!entry.poly_plastic_needed) addFlag('poly_plastic_needed', '6-Mil Poly Plastic?');
    if (entry.poly_plastic_needed === 'Yes') {
      entry.poly_plastic_rolls = v('poly_plastic_rolls');
      if (!entry.poly_plastic_rolls) addFlag('poly_plastic_rolls', 'Poly Plastic Rolls');
    }
  }

  if (flags.length > 0) { entry._flags = flags; entry._flag_labels = flagLabels; }
  return entry;
}

/**
 * Map AI-extracted data to a Lawn Repair entry with auto-flagging.
 */
export function mapLawnEntry(op) {
  const type = op.lawn_type || '';
  if (!type) return null;

  const f = op.lawn_fields || {};
  const flags = [], flagLabels = {};
  const addFlag = (k, l) => { flags.push(k); flagLabels[k] = l; };
  const v = (key) => s(f[key] ?? op[key]);

  const entry = { lawn_type: type, sub_type: type, time_estimate: v('time_estimate'), notes: v('notes') };
  if (!entry.time_estimate) addFlag('time_estimate', 'Time Estimate (hrs)');

  entry.length = v('length');
  entry.width = v('width');
  if (!entry.length) addFlag('length', 'Length (ft)');
  if (!entry.width) addFlag('width', 'Width (ft)');

  if (type === 'Sod Installation') {
    entry.on_slope = v('on_slope');
    if (!entry.on_slope) addFlag('on_slope', 'On a Slope?');
    entry.sf_waste = v('sf_waste');
    if (!entry.sf_waste) addFlag('sf_waste', 'SF Extra for Waste');
    entry.diff_easy_hours = v('diff_easy_hours');
    if (!entry.diff_easy_hours) addFlag('diff_easy_hours', 'Easy difficulty (hrs)');
    entry.diff_avg_hours = v('diff_avg_hours');
    if (!entry.diff_avg_hours) addFlag('diff_avg_hours', 'Average difficulty (hrs)');
    entry.diff_hard_hours = v('diff_hard_hours');
    if (!entry.diff_hard_hours) addFlag('diff_hard_hours', 'Hard difficulty (hrs)');
    entry.diff_very_hard_hours = v('diff_very_hard_hours');
    if (!entry.diff_very_hard_hours) addFlag('diff_very_hard_hours', 'Very Hard / Patching (hrs)');
    entry.sod_staples_needed = v('sod_staples_needed');
    if (!entry.sod_staples_needed) addFlag('sod_staples_needed', 'Sod Staples Needed?');
    if (entry.sod_staples_needed === 'Yes') {
      entry.sod_staples_count = v('sod_staples_count');
      if (!entry.sod_staples_count) addFlag('sod_staples_count', 'Sod Staples Count');
    }
    entry.pallets_needed = v('pallets_needed');
    if (!entry.pallets_needed) addFlag('pallets_needed', 'Pallets Needed?');
    if (entry.pallets_needed === 'Yes') {
      entry.pallets_count = v('pallets_count');
      if (!entry.pallets_count) addFlag('pallets_count', 'Pallets Count');
    }
    entry.watering_on_install = v('watering_on_install');
    if (!entry.watering_on_install) addFlag('watering_on_install', 'Watering Upon Installation?');
    if (entry.watering_on_install === 'Yes') {
      entry.water_access = v('water_access');
      if (!entry.water_access) addFlag('water_access', 'Water Access?');
      entry.watering_time_hours = v('watering_time_hours');
      if (!entry.watering_time_hours) addFlag('watering_time_hours', 'Watering Time (hrs)');
    }
    entry.fertilizer = v('fertilizer');
    if (!entry.fertilizer) addFlag('fertilizer', 'Fertilizer?');
    if (entry.fertilizer === 'Yes') {
      entry.fertilizer_sf_override = v('fertilizer_sf_override');
    }
    entry.distance_to_truck = v('distance_to_truck');
    if (!entry.distance_to_truck) addFlag('distance_to_truck', 'Distance to Truck (ft)');
    entry.machine_access = v('machine_access');
    if (!entry.machine_access) addFlag('machine_access', 'Machine Access');
    entry.sod_type = v('sod_type');
    if (!entry.sod_type) addFlag('sod_type', 'Sod Type');
  }

  if (type === 'Seed Install') {
    entry.sf_seed = v('sf_seed');
    entry.seed_type = v('seed_type');
    if (!entry.seed_type) addFlag('seed_type', 'Seed Type');
    entry.seed_lbs = v('seed_lbs');
    entry.extra_seed = v('extra_seed');
    if (!entry.extra_seed) addFlag('extra_seed', 'Extra Seed to Match Installed?');
    entry.cover_method = v('cover_method');
    if (!entry.cover_method) addFlag('cover_method', 'Cover Method');
    if (entry.cover_method === 'Mulch Pellet') {
      entry.mulch_bags = v('mulch_bags');
      entry.mulch_buckets = v('mulch_buckets');
    }
    if (entry.cover_method === 'Straw Netting') {
      entry.straw_mat_type = v('straw_mat_type');
      if (!entry.straw_mat_type) addFlag('straw_mat_type', 'Straw Mat Type');
      entry.straw_rolls = v('straw_rolls');
      entry.straw_sod_staples = v('straw_sod_staples');
      if (!entry.straw_sod_staples) addFlag('straw_sod_staples', 'Sod Staples (count)');
    }
    entry.temp_downspout_needed = v('temp_downspout_needed');
    if (!entry.temp_downspout_needed) addFlag('temp_downspout_needed', 'Temporary Downspout Extensions?');
    if (entry.temp_downspout_needed === 'Yes') {
      entry.temp_downspout_lf = v('temp_downspout_lf');
      if (!entry.temp_downspout_lf) addFlag('temp_downspout_lf', 'Downspout Extension Length (LF)');
    }
    entry.water_access = v('water_access');
    if (!entry.water_access) addFlag('water_access', 'Water Access?');
    entry.fertilizer = v('fertilizer');
    if (!entry.fertilizer) addFlag('fertilizer', 'Fertilizer?');
    entry.bed_prep_needed = v('bed_prep_needed');
    if (!entry.bed_prep_needed) addFlag('bed_prep_needed', 'Bed Preparation Needed?');
  }

  if (type === 'Top Dress Lawn') {
    entry.top_dress_depth = v('top_dress_depth');
    if (!entry.top_dress_depth) addFlag('top_dress_depth', 'Top Dress Depth (in)');
    entry.material = v('material');
    if (!entry.material) addFlag('material', 'Material');
    entry.overseed = v('overseed');
    if (!entry.overseed) addFlag('overseed', 'Overseed?');
    entry.aerate = v('aerate');
    if (!entry.aerate) addFlag('aerate', 'Aerate?');
  }

  if (flags.length > 0) { entry._flags = flags; entry._flag_labels = flagLabels; }
  return entry;
}

/**
 * Map AI-extracted data to a Planting entry with auto-flagging.
 */
export function mapPlantingEntry(op) {
  const type = op.planting_type || '';
  if (!type) return null;

  const f = op.planting_fields || {};
  const flags = [], flagLabels = {};
  const addFlag = (k, l) => { flags.push(k); flagLabels[k] = l; };
  const v = (key) => s(f[key] ?? op[key]);
  const arr = (key) => Array.isArray(f[key]) ? f[key] : (Array.isArray(op[key]) ? op[key] : []);

  const entry = { planting_type: type, sub_type: type, time_estimate: v('time_estimate'), notes: v('notes') };
  if (!entry.time_estimate) addFlag('time_estimate', 'Time Estimate (hrs)');

  entry.additional_time_rocky = v('additional_time_rocky');
  if (!entry.additional_time_rocky) addFlag('additional_time_rocky', 'Rocky Soil');
  entry.additional_time_roots = v('additional_time_roots');
  if (!entry.additional_time_roots) addFlag('additional_time_roots', 'Roots');

  if (type === 'Trees & Shrubs') {
    entry.trees = arr('trees');
    entry.shrubs = arr('shrubs');
    if (!entry.trees.length && !entry.shrubs.length) addFlag('trees', 'Trees or Shrubs list');

    entry.mycorrhizae_tablets = v('mycorrhizae_tablets');
    if (!entry.mycorrhizae_tablets) addFlag('mycorrhizae_tablets', 'Mycorrhizae Tablets (count)');

    entry.hand_vs_machine = v('hand_vs_machine');
    if (!entry.hand_vs_machine) addFlag('hand_vs_machine', 'Excavation: Hand or Machine?');
    if (entry.hand_vs_machine === 'Machine') {
      entry.machine_type = v('machine_type');
      if (!entry.machine_type) addFlag('machine_type', 'Machine Type');
    }

    entry.ball_cart = v('ball_cart');
    if (!entry.ball_cart) addFlag('ball_cart', 'Ball Cart?');
    entry.tree_sling = v('tree_sling');
    if (!entry.tree_sling) addFlag('tree_sling', 'Tree Sling?');
    entry.tree_boom = v('tree_boom');
    if (!entry.tree_boom) addFlag('tree_boom', 'Tree Boom?');
    entry.ramps = v('ramps');
    if (!entry.ramps) addFlag('ramps', 'Ramps (count)');
    entry.stake_kit = v('stake_kit');
    if (!entry.stake_kit) addFlag('stake_kit', 'Stake Kit?');
    entry.cage = v('cage');
    if (!entry.cage) addFlag('cage', 'Cage?');

    entry.mulch_ring = v('mulch_ring');
    if (!entry.mulch_ring) addFlag('mulch_ring', 'Mulch Ring?');
    entry.haul_off_debris = v('haul_off_debris');
    if (!entry.haul_off_debris) addFlag('haul_off_debris', 'Haul Off Debris?');

    entry.watering_hours = v('watering_hours');
    if (!entry.watering_hours) addFlag('watering_hours', 'Watering Hours');
    entry.watering_days = v('watering_days');
    if (!entry.watering_days) addFlag('watering_days', 'Watering Days');
    entry.water_access = v('water_access');
    if (!entry.water_access) addFlag('water_access', 'Water Access?');

    entry.delivery_by = v('delivery_by');
    if (!entry.delivery_by) addFlag('delivery_by', 'By Aspen or By Others?');
    entry.box_truck = v('box_truck');
    if (!entry.box_truck) addFlag('box_truck', 'Box Truck?');
    entry.flatbed = v('flatbed');
    if (!entry.flatbed) addFlag('flatbed', 'Flatbed?');
    entry.forklift = v('forklift');
    if (!entry.forklift) addFlag('forklift', 'Forklift?');
  }

  if (type === 'Perennials') {
    entry.large_plants = arr('large_plants');
    entry.large_spacing = v('large_spacing');
    entry.small_plants = arr('small_plants');
    entry.small_spacing = v('small_spacing');
    if (!entry.large_plants.length && !entry.small_plants.length) addFlag('large_plants', 'Perennial plant lists');
    if (entry.large_plants.length && !entry.large_spacing) addFlag('large_spacing', 'Large Perennial Spacing');
    if (entry.small_plants.length && !entry.small_spacing) addFlag('small_spacing', 'Small Perennial Spacing');

    entry.bed_condition = v('bed_condition');
    if (!entry.bed_condition) addFlag('bed_condition', 'Bed Condition');

    entry.mycorrhizae_tablets = v('mycorrhizae_tablets');
    if (!entry.mycorrhizae_tablets) addFlag('mycorrhizae_tablets', 'Mycorrhizae Tablets (count)');

    entry.watering_hours = v('watering_hours');
    if (!entry.watering_hours) addFlag('watering_hours', 'Time for Watering (hrs)');
    entry.water_access = v('water_access');
    if (!entry.water_access) addFlag('water_access', 'Water Access?');
  }

  if (type === 'Bulbs') {
    entry.bulbs = arr('bulbs');
    if (!entry.bulbs.length) addFlag('bulbs', 'Bulbs list');

    entry.mulched_soil = v('mulched_soil');
    if (!entry.mulched_soil) addFlag('mulched_soil', 'Mulched Soil?');
    entry.bulb_fertilizer = v('bulb_fertilizer');
    if (!entry.bulb_fertilizer) addFlag('bulb_fertilizer', 'Bulb Fertilizer?');
    entry.milwaukee_drill = v('milwaukee_drill');
    if (!entry.milwaukee_drill) addFlag('milwaukee_drill', 'Milwaukee Drill?');
    entry.drill_auger = v('drill_auger');
    if (!entry.drill_auger) addFlag('drill_auger', 'Drill Auger?');
    entry.bulb_plugger = v('bulb_plugger');
    if (!entry.bulb_plugger) addFlag('bulb_plugger', 'Bulb Plugger?');
    entry.cut_weed_barrier = v('cut_weed_barrier');
    if (!entry.cut_weed_barrier) addFlag('cut_weed_barrier', 'Cut Weed Barrier?');

    entry.watering_hours = v('watering_hours');
    if (!entry.watering_hours) addFlag('watering_hours', 'Time for Watering (hrs)');
    entry.water_access = v('water_access');
    if (!entry.water_access) addFlag('water_access', 'Water Access?');
  }

  if (type === 'Annuals') {
    entry.annuals = arr('annuals');
    if (!entry.annuals.length) addFlag('annuals', 'Annuals list');

    entry.watering_hours = v('watering_hours');
    if (!entry.watering_hours) addFlag('watering_hours', 'Time for Watering (hrs)');
    entry.water_access = v('water_access');
    if (!entry.water_access) addFlag('water_access', 'Water Access?');
  }

  if (flags.length > 0) { entry._flags = flags; entry._flag_labels = flagLabels; }
  return entry;
}

/**
 * Map AI-extracted data to a Rough Grading & Hauling entry with auto-flagging.
 */
export function mapRoughGradingEntry(op) {
  const sub = op.sub_type || op.rg_sub_type || '';
  if (!sub) return null;

  const f = op.rg_fields || {};
  const flags = [], flagLabels = {};
  const addFlag = (k, l) => { flags.push(k); flagLabels[k] = l; };
  const v = (key) => s(f[key] ?? op[key]);
  const arr = (key) => Array.isArray(f[key]) ? f[key] : (Array.isArray(op[key]) ? op[key] : []);

  const sfLen = v('sf_length');
  const sfWid = v('sf_width');
  const sf = sfLen && sfWid ? String(Math.round(parseFloat(sfLen) * parseFloat(sfWid))) : '';

  const entry = { sub_type: sub, time_estimate: v('time_estimate'), notes: v('notes') };
  if (!entry.time_estimate) addFlag('time_estimate', 'Time Estimate (hrs)');

  entry.sf_length = sfLen;
  entry.sf_width = sfWid;
  entry.sf = sf;
  if (!sf) addFlag('sf', 'Square Footage');
  entry.depth_inches = v('depth_inches');
  if (!entry.depth_inches) addFlag('depth_inches', 'Depth (inches)');

  // Step 2 fields per sub-type
  const cfg = RG_FIELDS[sub];
  if (cfg) {
    for (const field of cfg.step2) {
      entry[field.key] = v(field.key);
      if (!entry[field.key]) addFlag(field.key, field.label);
    }
  }

  // Soil types (importation sub-types)
  if (sub === 'importation_hand' || sub === 'importation_machine') {
    entry.soil_types = arr('soil_types');
    if (!entry.soil_types.length) addFlag('soil_types', 'Soil Type (select all that apply)');
  }

  // Step 3 fields per sub-type (respect conditions)
  if (cfg) {
    for (const field of cfg.step3) {
      const condMet = !field.condition || entry[field.condition.key] === field.condition.value;
      entry[field.key] = v(field.key);
      if (!entry[field.key] && condMet) addFlag(field.key, field.label);
    }
  }

  // Disposal details (excavation_machine only, when disposal_needed = Yes)
  if (sub === 'excavation_machine' && entry.disposal_needed === 'Yes') {
    entry.disposal_material_type = v('disposal_material_type');
    if (!entry.disposal_material_type) addFlag('disposal_material_type', 'Material Type');
    entry.disposal_dry_wet = v('disposal_dry_wet');
    if (!entry.disposal_dry_wet) addFlag('disposal_dry_wet', 'Dry or Wet');
    entry.disposal_fees = arr('disposal_fees');
    if (!entry.disposal_fees.length) addFlag('disposal_fees', 'Disposal Fees (select all that apply)');
  }

  if (flags.length > 0) { entry._flags = flags; entry._flag_labels = flagLabels; }
  return entry;
}

/**
 * Map AI-extracted data to a Mulch entry with auto-flagging.
 */
export function mapMulchEntry(op) {
  const type = op.mulch_type || '';
  if (!type) return null;

  const f = op.mulch_fields || {};
  const flags = [], flagLabels = {};
  const addFlag = (k, l) => { flags.push(k); flagLabels[k] = l; };
  const v = (key) => s(f[key] ?? op[key]);

  const entry = { mulch_type: type, sub_type: type, time_estimate: v('time_estimate'), notes: v('notes') };
  if (!entry.time_estimate) addFlag('time_estimate', 'Time Estimate (hrs)');

  entry.length = v('length') || (op.sf_length != null ? String(op.sf_length) : '');
  entry.width = v('width') || (op.sf_width != null ? String(op.sf_width) : '');
  entry.depth = v('depth') || (op.mulch_depth != null ? String(op.mulch_depth) : '');
  if (!entry.length) addFlag('length', 'Length (ft)');
  if (!entry.width) addFlag('width', 'Width (ft)');
  if (!entry.depth) addFlag('depth', 'Depth (in)');

  entry.bed_type = v('bed_type');

  if (type === 'Organic') {
    entry.install_type = v('install_type');
    if (!entry.install_type) addFlag('install_type', 'Refresh vs Full Install');
    entry.organic_subtype = v('organic_subtype');
    if (!entry.organic_subtype) addFlag('organic_subtype', 'Mulch Subtype');
    entry.distance_to_truck = v('distance_to_truck');
    if (!entry.distance_to_truck) addFlag('distance_to_truck', 'Distance to Truck (ft)');
  }

  if (type === 'Stone') {
    entry.fabric_needed = v('fabric_needed');
    if (!entry.fabric_needed) addFlag('fabric_needed', 'Fabric Needed?');
    if (entry.fabric_needed === 'Yes') {
      entry.fabric_sf = v('fabric_sf');
    }
  }

  entry.machine_access = v('machine_access');
  if (!entry.machine_access) addFlag('machine_access', 'Machine Access');

  if (flags.length > 0) { entry._flags = flags; entry._flag_labels = flagLabels; }
  return entry;
}

/**
 * Map AI-extracted data to a Site Management & Daily Cleanup entry with auto-flagging.
 */
export function mapSiteManagementEntry(op) {
  const f = op.sm_fields || {};
  const flags = [], flagLabels = {};
  const addFlag = (k, l) => { flags.push(k); flagLabels[k] = l; };
  const v = (key) => {
    const val = f[key] ?? op[key];
    if (val === true || val === 'true' || val === 'Yes' || val === 'yes') return true;
    if (val === false || val === 'false' || val === 'No' || val === 'no') return false;
    return (val != null && val !== '') ? String(val) : '';
  };

  const entry = { sub_type: 'Site Management', time_estimate: v('time_estimate'), notes: v('notes') };
  if (!entry.time_estimate) addFlag('time_estimate', 'Time Estimate (hrs)');

  for (const stage of SM_STAGES) {
    for (const field of stage.fields) {
      const val = v(field.key);
      entry[field.key] = val;
      // Only flag non-checkbox fields (number, text) when condition is met and value is missing
      if (field.type !== 'checkbox') {
        const condMet = !field.condition || entry[field.condition.key] === field.condition.value;
        if (condMet && !val) addFlag(field.key, field.label);
      }
    }
  }

  if (flags.length > 0) { entry._flags = flags; entry._flag_labels = flagLabels; }
  return entry;
}