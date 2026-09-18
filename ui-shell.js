(() => {
  "use strict";

  // Shared Adventure Incremental DOM shell.
  document.body.innerHTML = String.raw`
<div class="app">
  <div id="gameScreen">
    <div class="topbar">
      <div class="energy-box">
        <div class="energy-line">
          <span>Energy</span>
          <span id="energyText">100 / 100</span>
        </div>
        <div class="energy-bar"><div id="energyFill" class="energy-fill"></div></div>
      </div>
      <div class="top-actions">
        <button class="small-btn qa-report-btn" data-qa-report>QA Report</button>
        <button class="small-btn" id="saveBtn">Save</button>
        <button class="small-btn" id="wipeBtn">Wipe Save</button>
      </div>
    </div>

    <div class="stage-header">
      <h1>Stage 1 — Preparing for the Journey</h1>
      <p>Build enough Discipline for the Arena, earn travel money, then hire a wagon to the Capital.</p>
    </div>

    <div class="layout">
      <section class="panel">
        <h2>Tasks</h2>
        <div id="taskList" class="task-list"></div>
      </section>

      <aside class="panel">
        <h2>Adventurer Skills</h2>
        <div id="skills" class="skills"></div>
      </aside>
    </div>

  </div>

  <div id="failureScreen" class="story-screen">
    <div class="story-card">
      <h2>You worked yourself to death. Literally. Don’t do that.</h2>
      <p>Your attempt ended before you even chose a path.</p>
      <button id="restartStage1Btn">Return to Start of Stage One</button>
    </div>
  </div>

  <div id="stage2Screen" style="display:none;">
    <div class="topbar">
      <div class="energy-box">
        <div class="energy-line">
          <span>Energy</span>
          <span id="stage2EnergyText">0 / 0</span>
        </div>
        <div class="energy-bar"><div id="stage2EnergyFill" class="energy-fill"></div></div>
      </div>
      <div class="top-actions">
        <button class="small-btn qa-report-btn" data-qa-report>QA Report</button>
        <button class="small-btn" id="stage2SaveBtn">Save</button>
        <button class="small-btn" id="stage2WipeBtn">Wipe Save</button>
      </div>
    </div>

    <div class="stage-header">
      <h1>Stage 2 — The Capital</h1>
      <p>You made it to the Capital. For this beta, the Arena is the only available path.</p>
    </div>

    <div class="layout">
      <section class="panel">
        <h2>Travel</h2>
        <div id="stage2TaskList" class="task-list"></div>
      </section>

      <aside class="panel">
        <h2>Adventurer Skills</h2>
        <div id="stage2Skills" class="skills"></div>
      </aside>
    </div>
  </div>

  <div id="stage2FailureScreen" class="story-screen">
    <div class="story-card">
      <h2>You attempted to go home.</h2>
      <p>No carriages were heading in that direction. Confident in your skill, you set off on foot.</p>
      <p><strong>You were wrong. You starved to death.</strong></p>
      <button id="restartFromStage2Btn">Return to Start of Stage One</button>
    </div>
  </div>

  <div id="classScreen" style="display:none;">
    <div class="topbar">
      <div class="energy-box">
        <div class="energy-line">
          <span>Energy</span>
          <span id="classEnergyText">0 / 0</span>
        </div>
        <div class="energy-bar"><div id="classEnergyFill" class="energy-fill"></div></div>
      </div>
      <div class="top-actions">
        <button class="small-btn qa-report-btn" data-qa-report>QA Report</button>
        <button class="small-btn" id="classSaveBtn">Save</button>
        <button class="small-btn" id="classWipeBtn">Wipe Save</button>
      </div>
    </div>

    <div class="stage-header">
      <h1 id="classStageTitle">Class — Stage 1</h1>
      <p id="classStageSubtitle">Bare-bones travel test area.</p>
    </div>

    <div class="layout">
      <section class="panel">
        <div class="task-panel-heading">
          <h2>Tasks</h2>
          <label id="classAutoMasterToggle" class="auto-master-toggle" style="display:none;" title="Pause or resume all checked Auto tasks without changing your per-task selections.">
            <input type="checkbox" id="classAutoEnabled">
            <span>Auto Enabled</span>
          </label>
        </div>
        <div id="classAutoStatus" class="auto-status locked">Auto unlocks after clearing Stage 3 once.</div>
        <div id="classTaskList" class="task-list"></div>
      </section>

      <aside class="panel">
        <h2 id="classSkillsTitle">Class Skills</h2>
        <div id="classSkills" class="skills"></div>
      </aside>
    </div>
  </div>
</div>

<div id="qaReportOverlay" class="qa-report-overlay" style="display:none;">
  <div class="qa-report-card">
    <h2>V13-Warrior-Beta-EnergyCurve Test Report</h2>
    <p>This report is generated from the save. Copy it and send the whole block back.</p>
    <textarea id="qaReportText" readonly spellcheck="false"></textarea>
    <div class="qa-report-actions">
      <button id="qaCopyReportBtn">Copy Report</button>
      <button id="qaCloseReportBtn">Close</button>
    </div>
  </div>
</div>

<div id="tooltip" class="tooltip"></div>
`;
})();
