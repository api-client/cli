/**
 * Creates a simple table from an object definition.
 * 
 * This is to inspec object properties.
 * ┌───────┬──────────┐
 * │ name  │     test │
 * │ key   │   abcdef │
 * └───────┴──────────┘
 * 
 */
export class ObjectTable {
  data: any;
  namesSize = 10;
  valuesSize = 10;
  lines: string[] = [];

  constructor(data: any) {
    this.data = data;
  }

  print(): void {
    this.computeSizes();
    this.addHeader();
    this.addContent();
    this.addFooter();
    const result = this.lines.join('\n');
    console.log(result);
  }

  private computeSizes(): void {
    const { data } = this;
    const keys: string[] = Object.keys(data);

    let { namesSize, valuesSize } = this;

    keys.forEach((key) => {
      const nameLen = key.length;
      const valueLen = String(data[key]).length;
      
      if (nameLen > namesSize) {
        namesSize = nameLen;
      }
      if (valueLen > valuesSize) {
        valuesSize = valueLen;
      }
    });

    this.namesSize = namesSize;
    this.valuesSize = valuesSize;
  }

  private addHeader(): void {
    const { namesSize, valuesSize } = this;
    let str = '┌';
    str += '─'.repeat(namesSize + 3);
    str += '┬';
    str += '─'.repeat(valuesSize + 3);
    str += '┐';
    this.lines.push(str);
  }

  private addFooter(): void {
    const { namesSize, valuesSize } = this;
    let str = '└';
    str += '─'.repeat(namesSize + 3);
    str += '┴';
    str += '─'.repeat(valuesSize + 3);
    str += '┘';
    this.lines.push(str);
  }

  private addContent(): void {
    const { namesSize, valuesSize, data } = this;
    
    const nl = namesSize + 1;
    const vl = valuesSize + 1;
    
    const keys: string[] = Object.keys(data);

    keys.forEach((key) => {
      const v = String(data[key]);
      const name = key.padEnd(nl, ' ');
      const value = v.padStart(vl, ' ');

      const line = `│ ${name} │ ${value} │`;
      this.lines.push(line);
    });
  }
}
