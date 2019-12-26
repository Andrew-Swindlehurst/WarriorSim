class Player {
    constructor(testItem, testType, enchtype) {
        this.rage = 0;
        this.level = 60;
        this.timer = 0;
        this.dodgeTimer = 0;
        this.extraattacks = 0;
        this.nextswinghs = false;
        this.nextswingcl = false;
        if (enchtype == 1) {
            this.testEnch = testItem;
            this.testEnchType = testType;
        }
        else if (enchtype == 2) {
            this.testTempEnch = testItem;
            this.testTempEnchType = testType;
        }
        else {
            this.testItem = testItem;
            this.testItemType = testType;
        }
        this.target = {
            level: parseInt($('input[name="targetlevel"]').val()),
            basearmor: parseInt($('input[name="targetarmor"]').val()),
            armor: parseInt($('input[name="targetarmor"]').val()),
            defense: parseInt($('input[name="targetlevel"]').val()) * 5,
            mitigation: 1 - 15 * ((parseInt($('input[name="targetresistance"]').val()) + 24) / 6000),
        };
        this.base = {
            ap: 0,
            agi: 0,
            str: 0,
            hit: 0,
            crit: 0,
            spellcrit: 0,
            skill_0: this.level * 5,
            skill_1: this.level * 5,
            skill_2: this.level * 5,
            skill_3: this.level * 5,
            skill_4: this.level * 5,
            haste: 1,
            strmod: 1,
            agimod: 1,
            dmgmod: 1,
            apmod: 1
        };
        this.stats = {};
        this.auras = {};
        this.spells = {};
        this.items = [];
        this.addRace();
        this.addTalents();
        this.addGear();
        this.addTrinkets();
        this.addSets();
        this.addEnchants();
        this.addTempEnchants();
        this.addBuffs();
        this.addSpells();
        if (!this.mh || !this.oh) return;
        if (this.talents.flurry) this.auras.flurry = new Flurry(this);
        if (this.spells.overpower) this.auras.battlestance = new BattleStance(this);
        if (this.items.includes(14554)) this.auras.cloudkeeper = new Cloudkeeper(this);
        this.update();
    }
    addRace() {
        for (let race of races) {
            if (race.name == $('select[name="race"]').val()) {
                this.base.aprace = race.ap;
                this.base.ap += race.ap;
                this.base.str += race.str;
                this.base.agi += race.agi;
                this.base.skill_0 += race.skill_0;
                this.base.skill_1 += race.skill_1;
                this.base.skill_2 += race.skill_2;
                this.base.skill_3 += race.skill_3;
            }
        }
    }
    addTalents() {
        this.talents = {};
        for (let tree in talents) {
            for (let talent of talents[tree].t) {
                $.extend(this.talents, talent.aura(talent.c));
            }
        }
    }
    addGear() {
        for (let type in gear) {
            if (type == "finger" || type == "trinket") continue;
            for (let item of gear[type]) {
                if ((this.testItemType == type && this.testItem == item.id) ||
                    (this.testItemType != type && item.selected)) {
                    for (let prop in this.base)
                        this.base[prop] += item[prop] || 0;
                    if (item.skill && item.skill > 0) {
                        if (item.type == 'Varied') {
                            this.base['skill_1'] += item.skill;
                            this.base['skill_2'] += item.skill;
                            this.base['skill_3'] += item.skill;
                        }
                        else {
                            let sk = WEAPONTYPE[item.type.toUpperCase()];
                            this.base['skill_' + sk] += item.skill;
                        }
                    }

                    if (type == "mainhand" || type == "offhand")
                        this.addWeapon(item, type);

                    // Blazefury Medallion
                    if (item.id == 17111) { 
                        this.attackproc = {};
                        this.attackproc.chance = item.procchance * 100;
                        this.attackproc.magicdmg = item.magicdmg;
                    }

                    this.items.push(item.id);
                }
            }
        }
    }
    addTrinkets() {
        let fingers = [];
        let trinkets = [];

        for (let item of gear.finger)
            if (item.selected) fingers.push(item);
        for (let item of gear.trinket)
            if (item.selected) trinkets.push(item);

        if (this.testItemType == "finger") {
            for (let item of gear.finger) {
                if (item.id == this.testItem) {
                    if (fingers.includes(item))
                        break;
                    else if (fingers.length < 2)
                        fingers.push(item);
                    else if (parseFloat(fingers[0].dps) > parseFloat(fingers[1].dps))
                        fingers[1] = item;
                    else
                        fingers[0] = item;
                }
            }
        }

        if (this.testItemType == "trinket") {
            for (let item of gear.trinket) {
                if (item.id == this.testItem) {
                    if (trinkets.includes(item))
                        break;
                    else if (trinkets.length < 2)
                        trinkets.push(item);
                    else if (parseFloat(trinkets[0].dps) > parseFloat(trinkets[1].dps))
                        trinkets[1] = item;
                    else
                        trinkets[0] = item;
                }
            }
        }

        for(let item of fingers) {
            for (let prop in this.base)
                this.base[prop] += item[prop] || 0;
        }

        let index = 0;
        for(let item of trinkets) {
            index++;
            for (let prop in this.base)
                this.base[prop] += item[prop] || 0;

            if (item.procchance) {
                let proc = {};
                proc.chance = item.procchance * 100;
                proc.extra = item.procextra;
                proc.magicdmg = item.magicdmg;
                this["trinketproc" + index] = proc;
            }
        }
    }
    addWeapon(item, type) {

        let ench, tempench;
        for (let item of enchant[type]) {
            if (item.temp) continue;
            if (this.testEnchType == type && this.testEnch == item.id) ench = item;
            else if (this.testEnchType != type && item.selected) ench = item;
        }
        for (let item of enchant[type]) {
            if (!item.temp) continue;
            if (this.testTempEnchType == type && this.testTempEnch == item.id) tempench = item;
            else if (this.testTempEnchType != type && item.selected) tempench = item;
        }

        if (type == "mainhand")
            this.mh = new Weapon(this, item, ench, tempench, false);

        if (type == "offhand")
            this.oh = new Weapon(this, item, ench, tempench, true);

    }
    addEnchants() {
        for (let type in enchant) {
            for (let item of enchant[type]) {
                if (item.temp) continue;
                if ((this.testEnchType == type && this.testEnch == item.id) ||
                    (this.testEnchType != type && item.selected)) {

                    for (let prop in this.base) {
                        if (prop == 'haste')
                            this.base.haste /= (1 + item.haste / 100) || 1;
                        else
                            this.base[prop] += item[prop] || 0;
                    }
                }
            }
        }
    }
    addTempEnchants() {
        for (let type in enchant) {
            for (let item of enchant[type]) {
                if (!item.temp) continue;
                if ((this.testTempEnchType == type && this.testTempEnch == item.id) ||
                    (this.testTempEnchType != type && item.selected)) {

                    for (let prop in this.base)
                        this.base[prop] += item[prop] || 0;
                }
            }
        }
    }
    addSets() {
        for (let set of sets) {
            let counter = 0;
            for (let item of set.items)
                if (this.items.includes(item))
                    counter++;
            if (counter == 0)
                continue;
            for (let bonus of set.bonus) {
                if (counter >= bonus.count) {
                    for (let prop in bonus.stats)
                        this.base[prop] += bonus.stats[prop] || 0;
                }
            }
        }
    }
    addBuffs() {
        for (let buff of buffs) {
            if (buff.active) {
                let apbonus = 0;
                if (buff.group == "battleshout")
                    apbonus = ~~(buff.ap * this.talents.impbattleshout);

                this.base.ap += (buff.ap || 0) + apbonus;
                this.base.agi += buff.agi || 0;
                this.base.str += buff.str || 0;
                this.base.crit += buff.crit || 0;
                this.base.spellcrit += buff.spellcrit || 0;
                this.base.agimod *= (1 + buff.agimod / 100) || 1;
                this.base.strmod *= (1 + buff.strmod / 100) || 1;
                this.base.dmgmod *= (1 + buff.dmgmod / 100) || 1;
                this.base.haste /= (1 + buff.haste / 100) || 1;
            }
        }
    }
    addSpells() {
        for (let spell of spells) {
            if (spell.active) {
                if (spell.aura) this.auras[spell.classname.toLowerCase()] = eval(`new ${spell.classname}(this)`);
                else this.spells[spell.classname.toLowerCase()] = eval(`new ${spell.classname}(this)`);
            }
        }
    }
    reset(rage) {
        this.rage = rage;
        this.timer = 0;
        this.dodgeTimer = 0;
        this.mh.timer = 0;
        this.oh.use();
        this.extraattacks = 0;
        this.nextswinghs = false;
        this.nextswingcl = false;
        for (let s in this.spells) {
            this.spells[s].timer = 0;
            this.spells[s].stacks = 0;
        }
        for (let s in this.auras) {
            this.auras[s].timer = 0;
            this.auras[s].firstuse = true;
            this.auras[s].stacks = 0;
        }
        this.update();
    }
    update() {
        this.updateAuras();
        this.mh.glanceReduction = this.getGlanceReduction(this.mh);
        this.oh.glanceReduction = this.getGlanceReduction(this.oh);
        this.mh.glanceChance = this.getGlanceChance(this.mh);
        this.oh.glanceChance = this.getGlanceChance(this.oh);
        this.armorReduction = this.getArmorReduction();
        this.mh.miss = this.getMissChance(this.mh);
        this.oh.miss = this.getMissChance(this.oh);
        this.mh.dwmiss = (this.mh.miss > 0 ? this.mh.miss * 0.8 : this.mh.miss) + 20;
        this.oh.dwmiss = (this.oh.miss > 0 ? this.oh.miss * 0.8 : this.oh.miss) + 20;
        this.mh.dodge = this.getDodgeChance(this.mh);
        this.oh.dodge = this.getDodgeChance(this.oh);
    }
    updateAuras() {
        for (let prop in this.base)
            this.stats[prop] = this.base[prop];
        for (let name in this.auras) {
            if (this.auras[name].timer) {
                for (let prop in this.auras[name].stats)
                    this.stats[prop] += this.auras[name].stats[prop];
                for (let prop in this.auras[name].div_stats)
                    this.stats[prop] /= (1 + this.auras[name].div_stats[prop] / 100);
                for (let prop in this.auras[name].mult_stats)
                    this.stats[prop] *= (1 + this.auras[name].mult_stats[prop] / 100);
            }
        }
        this.stats.str = ~~(this.stats.str * this.stats.strmod);
        this.stats.agi = ~~(this.stats.agi * this.stats.agimod);
        this.stats.ap += this.stats.str * 2;
        this.stats.crit += this.stats.agi / 20;
        this.crit = this.getCritChance();

        if (this.stats.apmod != 1)
            this.stats.ap += ~~((this.base.aprace + this.stats.str * 2) * (this.stats.apmod - 1));
    }
    updateHaste() {
        this.stats.haste = this.base.haste;
        if (this.auras.flurry && this.auras.flurry.timer)
            this.stats.haste /= (1 + this.auras.flurry.div_stats.haste / 100);
        if (this.auras.jujuflurry && this.auras.jujuflurry.timer)
            this.stats.haste /= (1 + this.auras.jujuflurry.div_stats.haste / 100);
        if (this.auras.berserking && this.auras.berserking.timer)
            this.stats.haste /= (1 + this.auras.berserking.div_stats.haste / 100);
        if (this.auras.empyrean && this.auras.empyrean.timer)
            this.stats.haste /= (1 + this.auras.empyrean.div_stats.haste / 100);
        if (this.auras.eskhandar && this.auras.eskhandar.timer)
            this.stats.haste /= (1 + this.auras.eskhandar.div_stats.haste / 100);
    }
    updateBonusDmg() {
        let bonus = 0;
        if (this.auras.zeal && this.auras.zeal.timer)
            bonus += this.auras.zeal.stats.bonusdmg;
        this.mh.bonusdmg = this.mh.basebonusdmg + bonus;
        this.oh.bonusdmg = this.oh.basebonusdmg + bonus;
    }
    updateArmorReduction() {
        this.target.armor = this.target.basearmor;
        if (this.auras.annihilator && this.auras.annihilator.timer)
            this.target.armor = Math.max(this.target.armor - (this.auras.annihilator.stacks * this.auras.annihilator.armor), 0);
        this.armorReduction = this.getArmorReduction();
    }
    getGlanceReduction(weapon) {
        let low = 1.3 - 0.05 * (this.target.defense - this.stats['skill_' + weapon.type]);
        let high = 1.2 - 0.03 * (this.target.defense - this.stats['skill_' + weapon.type]);
        return (Math.min(low, 0.91) + Math.min(high, 0.99)) / 2;
    }
    getGlanceChance(weapon) {
        return 10 + (this.target.defense - Math.min(this.level * 5, this.stats['skill_' + weapon.type])) * 2;
    }
    getMissChance(weapon) {
        let diff = this.target.defense - this.stats['skill_' + weapon.type];
        let miss = 5 + (diff > 10 ? diff * 0.2 : diff * 0.1);
        miss -= (diff > 10 ? this.stats.hit - 1 : this.stats.hit);
        return miss;
    }
    getCritChance() {
        let crit = this.stats.crit + (this.talents.crit || 0) + (this.level - this.target.level) * 1 + (this.level - this.target.level) * 0.6 + 3;
        return Math.max(crit, 0);
    }
    getDodgeChance(weapon) {
        return 5 + (this.target.defense - this.stats['skill_' + weapon.type]) * 0.1;
    }
    getArmorReduction() {
        let r = this.target.armor / (this.target.armor + 400 + 85 * this.level);
        return r > 0.75 ? 0.75 : r;
    }
    addRage(dmg, result, spell) {
        if (spell) {
            if (result == RESULT.MISS || result == RESULT.DODGE)
                this.rage += spell.refund ? spell.cost * 0.8 : 0;
        }
        else {
            let mod = result == RESULT.MISS ? 0 : result == RESULT.DODGE ? 0.75 : 1;
            this.rage += (dmg / 230.6) * 7.5 * mod;
        }
        if (!spell || spell instanceof HeroicStrike) {
            if (result != RESULT.MISS && result != RESULT.DODGE && this.talents.umbridledwrath && rng10k() < this.talents.umbridledwrath * 100)
                this.rage += 1;
        }

        if (this.rage > 100) this.rage = 100;
    }
    step(simulation) {
        this.timer = this.timer < 400 ? 0 : this.timer - 400;
        this.dodgeTimer = this.dodgeTimer < 400 ? 0 : this.dodgeTimer - 400;

        // Spells
        if (this.spells.mortalstrike) this.spells.mortalstrike.step();
        if (this.spells.bloodthirst) this.spells.bloodthirst.step();
        if (this.spells.battleshout) this.spells.battleshout.step();
        if (this.spells.bloodrage) this.spells.bloodrage.step();
        if (this.spells.whirlwind) this.spells.whirlwind.step();
        if (this.spells.overpower) this.spells.overpower.step();

        // Auras
        if (this.auras.deepwounds && this.auras.deepwounds.timer) {
            this.auras.deepwounds.step(simulation);
            if (this.auras.deepwounds.timer)
                this.auras.deepwounds.step(simulation);
        }
        if (this.auras.battleshout && this.auras.battleshout.timer) {
            this.auras.battleshout.step();
        }
        if (this.auras.battlestance && this.auras.battlestance.timer) {
            this.auras.battlestance.step();
        }
        if (this.auras.jujuflurry && this.auras.jujuflurry.firstuse && this.auras.jujuflurry.timer) {
            this.auras.jujuflurry.step();
        }
        if (this.auras.mightyragepotion && this.auras.mightyragepotion.firstuse && this.auras.mightyragepotion.timer) {
            this.auras.mightyragepotion.step();
        }
        if (this.auras.deathwish && this.auras.deathwish.firstuse && this.auras.deathwish.timer) {
            this.auras.deathwish.step();
        }
        if (this.auras.recklessness && this.auras.recklessness.firstuse && this.auras.recklessness.timer) {
            this.auras.recklessness.step();
        }
        if (this.auras.bloodfury && this.auras.bloodfury.firstuse && this.auras.bloodfury.timer) {
            this.auras.bloodfury.step();
        }
        if (this.auras.berserking && this.auras.berserking.firstuse && this.auras.berserking.timer) {
            this.auras.berserking.step();
        }
        if (this.auras.cloudkeeper && this.auras.cloudkeeper.firstuse && this.auras.cloudkeeper.timer) {
            this.auras.cloudkeeper.step();
        }
        if (this.mh.proc1 && this.mh.proc1.spell && this.mh.proc1.spell.timer) {
            this.mh.proc1.spell.step();
        }
        if (this.mh.proc2 && this.mh.proc2.spell && this.mh.proc2.spell.timer) {
            this.mh.proc2.spell.step();
        }
        if (this.oh.proc1 && this.oh.proc1.spell && this.oh.proc1.spell.timer) {
            this.oh.proc1.spell.step();
        }
        if (this.oh.proc2 && this.oh.proc2.spell && this.oh.proc2.spell.timer) {
            this.oh.proc2.spell.step();
        }
    }
    rollweapon(weapon) {
        let tmp = 0;
        let roll = rng10k();
        tmp += Math.max(weapon.dwmiss, 0) * 100;
        if (roll < tmp) return RESULT.MISS;
        tmp += weapon.dodge * 100;
        if (roll < tmp) return RESULT.DODGE;
        tmp += weapon.glanceChance * 100;
        if (roll < tmp) return RESULT.GLANCE;
        tmp += (this.crit + weapon.crit) * 100;
        if (roll < tmp) return RESULT.CRIT;
        return RESULT.HIT;
    }
    rollspell(spell) {
        let tmp = 0;
        let roll = rng10k();
        tmp += Math.max(this.mh.miss, 0) * 100;
        if (roll < tmp) return RESULT.MISS;
        if (spell.canDodge) {
            tmp += this.mh.dodge * 100;
            if (roll < tmp) return RESULT.DODGE;
        }
        roll = rng10k();
        let crit = this.crit + this.mh.crit;
        if (spell instanceof Overpower)
            crit += this.talents.overpowercrit;
        if (roll < (crit * 100)) return RESULT.CRIT;
        return RESULT.HIT;
    }
    attack(weapon, extra) {
        let spell = null;
        let procdmg = 0;
        let heroicstrike = !weapon.offhand && this.nextswinghs;
        let result;
        if (this.nextswinghs) {
            result = this.rollspell(this.spells.heroicstrike);
        }
        else {
            result = this.rollweapon(weapon);
        }
        if (heroicstrike) {
            this.nextswinghs = false;
            if (this.spells.heroicstrike.cost <= this.rage) {
                spell = this.spells.heroicstrike;
                this.rage -= spell.cost;
            }
            else {
                heroicstrike = false;
            }
        }
        let dmg = weapon.dmg(heroicstrike);
        if (!extra)
            procdmg = this.procattack(spell, weapon, result);

        if (result == RESULT.DODGE) {
            this.dodgeTimer = 5000;
        }
        if (result == RESULT.GLANCE) {
            dmg *= weapon.glanceReduction;
        }
        if (result == RESULT.CRIT) {
            dmg *= 2;
            this.proccrit();
        }

        if (!extra) weapon.use();
        let done = this.dealdamage(dmg, result, spell);
        if (spell) spell.totaldmg += done;
        else weapon.totaldmg += done;
        weapon.totalprocdmg += procdmg;
        return done + procdmg;
    }
    cast(spell) {
        spell.use();
        let procdmg = 0;
        let dmg = spell.dmg() * this.mh.modifier;
        let result = this.rollspell(spell);
        procdmg = this.procattack(spell, this.mh, result);

        if (result == RESULT.DODGE) {
            this.dodgeTimer = 5000;
        }
        if (result == RESULT.CRIT && !spell.nocrit) {
            dmg *= 2 + this.talents.abilitiescrit;
            this.proccrit();
        }

        let done = this.dealdamage(dmg, result, spell);
        spell.totaldmg += done;
        this.mh.totalprocdmg += procdmg;
        return done + procdmg;
    }
    buff(spell) {
        spell.use();
        return 0;
    }
    dealdamage(dmg, result, spell) {
        dmg *= this.stats.dmgmod;
        if (result != RESULT.MISS && result != RESULT.DODGE) {
            dmg *= (1 - this.armorReduction);
            this.addRage(dmg, result, spell);
            return ~~dmg;
        }
        else {
            this.addRage(dmg, result, spell);
            return 0;
        }
    }
    proccrit() {
        if (this.auras.flurry) this.auras.flurry.use();
        if (this.auras.deepwounds) this.auras.deepwounds.use();
    }
    procattack(spell, weapon, result) {
        let procdmg = 0;
        if (!spell) {
            if (this.auras.flurry && this.auras.flurry.stacks)
                this.auras.flurry.step();
        }
        if (result != RESULT.MISS && result != RESULT.DODGE) {
            if (weapon.proc1 && rng10k() < weapon.proc1.chance) {
                if (weapon.proc1.spell) weapon.proc1.spell.use();
                if (weapon.proc1.magicdmg) procdmg += this.magicproc(weapon.proc1.magicdmg);
                if (weapon.proc1.physdmg) procdmg += this.physproc(weapon.proc1.physdmg);
                if (weapon.proc1.extra) this.extraattacks += weapon.proc1.extra;
            }
            if (weapon.proc2 && rng10k() < weapon.proc2.chance) {
                if (weapon.proc2.spell) weapon.proc2.spell.use();
                if (weapon.proc2.magicdmg) procdmg += this.magicproc(weapon.proc2.magicdmg);
            }
            if (this.trinketproc1 && rng10k() < this.trinketproc1.chance) {
                if (this.trinketproc1.extra) 
                    this.extraattacks += this.trinketproc1.extra;
                if (this.trinketproc1.magicdmg) procdmg += this.magicproc(this.trinketproc1.magicdmg);
            }
            if (this.trinketproc2 && rng10k() < this.trinketproc2.chance) {
                if (this.trinketproc2.extra) 
                    this.extraattacks += this.trinketproc2.extra;
                if (this.trinketproc2.magicdmg) procdmg += this.magicproc(this.trinketproc2.magicdmg);
            }
            if (this.attackproc && rng10k() < this.attackproc.chance) {
                if (this.attackproc.magicdmg) procdmg += this.magicproc(this.attackproc.magicdmg);
            }
            if (this.talents.swordproc && weapon.type == WEAPONTYPE.SWORD) {
                if (rng10k() < this.talents.swordproc * 100)
                    this.extraattacks++;
            }
        }
        return procdmg;
    }
    magicproc(dmg) {
        let mod = 1;
        if (rng10k() < 1700) return 0;
        if (rng10k() < (this.stats.spellcrit * 100)) mod = 1.5;
        return ~~(dmg * this.target.mitigation * mod);
    }
    physproc(dmg) {
        let tmp = 0;
        let roll = rng10k();
        tmp += Math.max(this.mh.miss, 0) * 100;
        if (roll < tmp) dmg = 0;
        tmp += this.mh.dodge * 100;
        if (roll < tmp) { this.dodgeTimer = 5000; dmg = 0; }
        roll = rng10k();
        let crit = this.crit + this.mh.crit;
        if (roll < (crit * 100)) dmg *= 2;
        return dmg * this.stats.dmgmod * this.mh.modifier;
    }
}