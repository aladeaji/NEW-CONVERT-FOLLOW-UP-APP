-- New indexes for hot query paths (Phase 9 perf pass)
CREATE INDEX "Person_nextFollowUpAt_idx" ON "Person"("nextFollowUpAt");
CREATE INDEX "Assignment_personId_idx" ON "Assignment"("personId");
CREATE INDEX "FollowUp_personId_idx" ON "FollowUp"("personId");
CREATE INDEX "FollowUp_workerId_idx" ON "FollowUp"("workerId");
CREATE INDEX "AttendanceRecord_personId_idx" ON "AttendanceRecord"("personId");
