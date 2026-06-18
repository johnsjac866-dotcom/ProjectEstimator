import { DEMO_FIELDS } from './demolitionStages';

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