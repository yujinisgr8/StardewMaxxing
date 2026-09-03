// Cross-platform parity check: asserts the Swift engine reproduces shared/fixtures/parity.json,
// the golden output of the TypeScript engine. Run with `npm run verify:ios`.
//
// This is a plain executable rather than an XCTest bundle so it runs in a couple of seconds
// from the same `npm` workflow as the desktop tests, with no simulator boot.

import Foundation
struct FixtureRoute: Decodable {
    let machineId: String, outputId: String
    let inputCount: Int, outputCount: Int, value: Int, extraCost: Int
    let perInputValue: Double, effectiveDays: Int
    let goldPerDay: Double?
    let appliedBonuses: [String]
    let best: Bool
}
struct FixtureItem: Decodable { let id: String; let routes: [FixtureRoute] }
struct FixtureCase: Decodable { let name: String; let settings: Settings; let items: [FixtureItem] }
struct Fixture: Decodable { let cases: [FixtureCase] }

let root = URL(fileURLWithPath: CommandLine.arguments[1])
let data = try GameData(itemsURL: root.appending(path: "items.json"),
                        machinesURL: root.appending(path: "machines.json"))
let fixture = try JSONDecoder().decode(
    Fixture.self, from: Data(contentsOf: root.appending(path: "fixtures/parity.json")))

let eps = 1e-9
var checks = 0, failures = 0
for c in fixture.cases {
    for expected in c.items {
        guard let item = data.item(id: expected.id) else {
            print("✗ unknown item \(expected.id)"); failures += 1; continue
        }
        let actual = data.engine.computeRoutes(item, c.settings)
        if actual.count != expected.routes.count {
            print("✗ \(c.name)/\(expected.id): \(actual.count) routes, expected \(expected.routes.count)")
            failures += 1; continue
        }
        for (i, e) in expected.routes.enumerated() {
            let a = actual[i]  // array order IS the ranking
            let goldOK = (a.goldPerDay == nil && e.goldPerDay == nil)
                || (a.goldPerDay != nil && e.goldPerDay != nil && abs(a.goldPerDay! - e.goldPerDay!) < eps)
            let identity: Bool = a.result.machineId == e.machineId && a.result.outputId == e.outputId
            let counts: Bool = a.result.inputCount == e.inputCount && a.result.outputCount == e.outputCount
            let money: Bool = a.value == e.value && a.extraCost == e.extraCost
                && abs(a.perInputValue - e.perInputValue) < eps
            let timing: Bool = a.effectiveDays == e.effectiveDays && goldOK
            let bonuses: Bool = a.appliedBonuses.map(\.key.rawValue) == e.appliedBonuses
            let ok = identity && counts && money && timing && bonuses && a.best == e.best
            if !ok {
                if failures < 10 {
                    print("✗ \(c.name)/\(expected.id) route \(i) (\(e.machineId))")
                    print("   expected value=\(e.value) perInput=\(e.perInputValue) days=\(e.effectiveDays) gpd=\(String(describing: e.goldPerDay)) bonuses=\(e.appliedBonuses) best=\(e.best) out=\(e.outputId)")
                    print("   actual   value=\(a.value) perInput=\(a.perInputValue) days=\(a.effectiveDays) gpd=\(String(describing: a.goldPerDay)) bonuses=\(a.appliedBonuses.map(\.key.rawValue)) best=\(a.best) out=\(a.result.outputId)")
                }
                failures += 1
            }
            checks += 1
        }
    }
}
print(failures == 0
    ? "\n✅ PARITY: \(fixture.cases.count) settings × \(data.items.count) items → \(checks) routes identical to the TypeScript engine"
    : "\n❌ \(failures) of \(checks) routes differ")
exit(failures == 0 ? 0 : 1)
