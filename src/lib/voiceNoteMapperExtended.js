import { PATIO_STAGES } from './patioStages';
import { HARDSCAPE_REPAIR_STAGES } from './hardscapeRepairStages';

const s = (v) => (v != null && v !== '') ? String(v) : '';
const b = (v) => {
  if (v === true || v === 'true' || v === 'Yes' || v === 'yes') return true;
  if (v === false || v === 'false' || v === 'No' || v === 'no') return false;
  return '';
};

/**
 * Map AI-extracted data to a Walkway/Patio entry with auto-flagging.
 */
export function mapPatioEntry(op) {
  const f = op.patio_fields || {};
  const flags = [], flagLabels = {};
  const addFlag = (k, l) => { flags.push(k); flagLabels[k] = l; };
  const v = (key) => s(f[key] ?? op[key]);

  const entry = { time_estimate: v('time_estimate'), notes: v('notes') };
  if (!entry.time_estimate) addFlag('time_estimate', 'Time Estimate (hrs)');

  // Iterate all patio stage fields
  for (const stage of PATIO_STAGES) {
    for (const field of stage.fields) {
      if (field.type === 'pick_one') {
        entry[field.key] = v(field.key);
        if (!entry[field.key]) addFlag(field.key, field.label);
      } else if (field.type !== 'textarea') {
        const condMet = !field.condition || entry[field.condition.key] === field.condition.value;
        if (condMet || field.condition == null) {
          entry[field.key] = v(field.key);
        }
      }
    }
  }

  if (flags.length > 0) { entry._flags = flags; entry._flag_labels = flagLabels; }
  return entry;
}

/**
 * Map AI-extracted data to a Hardscape - Repair Existing entry with auto-flagging.
 */
export function mapHardscapeRepairEntry(op) {
  const f = op.hr_fields || {};
  const flags = [], flagLabels = {};
  const addFlag = (k, l) => { flags.push(k); flagLabels[k] = l; };
  const v = (key) => s(f[key] ?? op[key]);

  const entry = { sub_type: v('repair_type') || 'Patio or Walkway', time_estimate: v('time_estimate'), notes: v('notes') };
  if (!entry.time_estimate) addFlag('time_estimate', 'Time Estimate (hrs)');

  for (const stage of HARDSCAPE_REPAIR_STAGES) {
    for (const field of stage.fields) {
      const condMet = !field.condition || entry[field.condition.key] === field.condition.value;
      entry[field.key] = v(field.key);
      if (field.type !== 'textarea' && condMet && !entry[field.key]) {
        addFlag(field.key, field.label);
      }
    }
  }

  if (flags.length > 0) { entry._flags = flags; entry._flag_labels = flagLabels; }
  return entry;
}

/**
 * Map AI-extracted data to a Maintenance entry with auto-flagging.
 */
export function mapMaintenanceEntry(op) {
  const type = op.maintenance_type || '';
  if (!type) return null;

  const f = op.maintenance_fields || {};
  const flags = [], flagLabels = {};
  const addFlag = (k, l) => { flags.push(k); flagLabels[k] = l; };
  const v = (key) => s(f[key] ?? op[key]);
  const arr = (key) => Array.isArray(f[key]) ? f[key] : (Array.isArray(op[key]) ? op[key] : []);

  const entry = { maintenance_type: type, sub_type: type, time_estimate: v('time_estimate'), notes: v('notes') };
  if (!entry.time_estimate) addFlag('time_estimate', 'Time Estimate (hrs)');

  // Common dimension fields
  entry.length = v('length');
  entry.width = v('width');
  const sf = entry.length && entry.width ? String(Math.round(parseFloat(entry.length) * parseFloat(entry.width))) : '';
  entry.sf = sf;

  if (type === 'Weeding') {
    if (!sf) addFlag('sf', 'Square Footage');
    entry.herbicide = v('herbicide');
    if (!entry.herbicide) addFlag('herbicide', 'Herbicide Treatment?');
    if (entry.herbicide === 'Yes') {
      entry.herbicide_sf = v('herbicide_sf');
      if (!entry.herbicide_sf) addFlag('herbicide_sf', 'Herbicide SF');
    }
  } else if (type === 'Core Aeration / Overseed') {
    if (!sf) addFlag('sf', 'Square Footage');
    entry.estimated_hours = v('estimated_hours');
    entry.overseed_needed = v('overseed_needed');
    if (entry.overseed_needed === 'Yes') {
      entry.seed_type = v('seed_type');
      if (!entry.seed_type) addFlag('seed_type', 'Seed Type');
    }
    entry.machine_needed = v('machine_needed');
  } else if (type === 'Follow up Care - Planting Bed Maintenance') {
    entry.visits = v('visits');
    entry.hours_per_visit = v('hours_per_visit');
    entry.bed_size = v('bed_size');
    entry.travel_time = v('travel_time');
    if (!entry.visits) addFlag('visits', 'Number of Visits');
    if (!entry.hours_per_visit) addFlag('hours_per_visit', 'Hours per Visit');
  } else if (type === 'Lawn') {
    if (!sf) addFlag('sf', 'Square Footage');
    entry.visits = v('visits');
    entry.hours_per_visit = v('hours_per_visit');
    entry.service_type = v('service_type');
    entry.travel_time = v('travel_time');
  } else if (type === 'Seasonal Clean Up') {
    if (!sf) addFlag('sf', 'Square Footage');
    entry.zones = v('zones');
    entry.estimated_hours = v('estimated_hours');
    entry.season_scope = v('season_scope');
    entry.disposal_needed = v('disposal_needed');
    if (entry.disposal_needed === 'Yes') {
      entry.debris_volume = v('debris_volume');
    }
  } else if (type === 'Trees & Shrubs') {
    entry.plants = arr('plants');
    entry.estimated_hours = v('estimated_hours');
    entry.service_type = v('service_type');
    entry.disposal_needed = v('disposal_needed');
    if (entry.disposal_needed === 'Yes') {
      entry.debris_volume = v('debris_volume');
    }
    if (!entry.plants.length) addFlag('plants', 'Plants list');
    if (!entry.estimated_hours) addFlag('estimated_hours', 'Estimated Hours');
  }

  if (flags.length > 0) { entry._flags = flags; entry._flag_labels = flagLabels; }
  return entry;
}

/**
 * Map AI-extracted data to a Pathway / Steps entry with auto-flagging.
 */
export function mapSteppingStoneEntry(op) {
  const sub = op.ss_sub_type || '';
  if (!sub) return null;

  const f = op.ss_fields || {};
  const flags = [], flagLabels = {};
  const addFlag = (k, l) => { flags.push(k); flagLabels[k] = l; };
  const v = (key) => s(f[key] ?? op[key]);

  const entry = { sub_type: sub, time_estimate: v('time_estimate'), notes: v('notes') };
  if (!entry.time_estimate) addFlag('time_estimate', 'Time Estimate (hrs)');

  if (sub === 'Stepping Stones') {
    entry.lf = v('lf');
    if (!entry.lf) addFlag('lf', 'Linear Feet (LF)');
    entry.stone_count = v('stone_count');
    entry.stone_type = v('stone_type');
    if (!entry.stone_type) addFlag('stone_type', 'Stone Type');
    entry.stone_size = v('stone_size');
    entry.existing_stones = v('existing_stones');
    if (entry.existing_stones === 'Yes') {
      entry.releveling = v('releveling');
      entry.additional_stones = v('additional_stones');
    }
    entry.existing_base = v('existing_base');
    entry.machine = v('machine');
  } else if (sub === 'Hardscape - Steps') {
    entry.step_count = v('step_count');
    if (!entry.step_count) addFlag('step_count', 'Count (# of steps)');
    entry.step_material = v('step_material');
    if (!entry.step_material) addFlag('step_material', 'Material');
    entry.step_length = v('step_length');
    entry.step_width = v('step_width');
    const stepSF = entry.step_length && entry.step_width ? String(Math.round(parseFloat(entry.step_length) * parseFloat(entry.step_width))) : '';
    entry.step_sf_calc = stepSF;
    entry.landing_needed = v('landing_needed');
    if (entry.landing_needed === 'Yes') {
      entry.landing_length = v('landing_length');
      entry.landing_width = v('landing_width');
    }
    entry.machine = v('machine');
  }

  if (flags.length > 0) { entry._flags = flags; entry._flag_labels = flagLabels; }
  return entry;
}

/**
 * Map AI-extracted data to a Retaining Wall entry with auto-flagging.
 */
export function mapRetainingWallEntry(op) {
  const wt = op.wall_type || '';
  if (!wt) return null;

  const f = op.rw_fields || {};
  const flags = [], flagLabels = {};
  const addFlag = (k, l) => { flags.push(k); flagLabels[k] = l; };
  const v = (key) => s(f[key] ?? op[key]);

  const entry = { wall_type: wt, notes: v('notes') };

  // Step 1: Excavation
  entry.exc_lf = v('exc_lf');
  if (!entry.exc_lf) addFlag('exc_lf', 'Excavation LF');
  entry.exc_wall_height = v('exc_wall_height');
  entry.exc_trench_depth = v('exc_trench_depth');
  entry.exc_trench_width = v('exc_trench_width');
  entry.exc_disposal = b(f.exc_disposal ?? op.exc_disposal);
  if (entry.exc_disposal === true || entry.exc_disposal === 'true') {
    entry.exc_distance_to_truck = v('exc_distance_to_truck');
    entry.exc_spoil_type = v('exc_spoil_type');
  }
  entry.exc_machine_access = v('exc_machine_access');

  // Step 2: Base Install
  entry.base_lf = v('base_lf');
  entry.base_width = v('base_width');
  entry.base_depth = v('base_depth');
  entry.base_fabric_sf = v('base_fabric_sf');
  entry.base_distance_to_truck = v('base_distance_to_truck');
  entry.base_road_gravel_type = v('base_road_gravel_type');
  entry.base_compactor = v('base_compactor');

  // Step 3: Wall details
  entry.wall_lf = v('wall_lf');
  if (!entry.wall_lf) addFlag('wall_lf', 'Wall LF');
  entry.wall_exposed_height = v('wall_exposed_height');
  if (!entry.wall_exposed_height) addFlag('wall_exposed_height', 'Exposed Height (ft)');

  if (wt === 'Boulder') {
    entry.boulder_type = v('boulder_type');
    entry.boulder_size = v('boulder_size');
    entry.boulder_count = v('boulder_count');
  } else {
    entry.wall_corner_count = v('wall_corner_count');
    entry.wall_geogrid = b(f.wall_geogrid ?? op.wall_geogrid);
  }

  entry.wall_fabric_sf = v('wall_fabric_sf');
  entry.wall_distance_to_truck = v('wall_distance_to_truck');
  entry.wall_machine_access = v('wall_machine_access');

  if (flags.length > 0) { entry._flags = flags; entry._flag_labels = flagLabels; }
  return entry;
}