import { installationProcess } from "@/data/installation-process";
import { installationSchema } from "@/lib/schema-builders";
import { JsonLd } from "./JsonLd";
export function InstallationProcess({ path }: { path: string }) {
  return <section className="content-section"><JsonLd data={installationSchema(path)} /><h2>Fabrikalara GES kurulum süreci nasıl işler?</h2><p>Bu adımlar yatırım planlamasını anlatır. Elektrik ve çatı uygulamaları yetkili uzman ekiplerce yapılır.</p><ol className="installation-steps">{installationProcess.map((step, index) => <li id={`kurulum-${index + 1}`} key={step.name}><h3>{step.name}</h3><p>{step.text}</p></li>)}</ol></section>;
}
