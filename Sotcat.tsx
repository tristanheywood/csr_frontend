import React from 'react';

type SotcatProps = {

}

type SotcatState = {
  imgData?: string,
  img?: HTMLImageElement;
  drops: Array<JSX.Element>,
  clipboardContent: string,
  selectedScanFname: string,
}

type Point = {
  x: number,
  y: number,
}


class Sotcat extends React.Component<SotcatProps, SotcatState> {

  amDrawingCircle: boolean;
  circleCenter?: Point;
  imgScale: number;
  canvasRef: React.RefObject<HTMLCanvasElement>;

  constructor(props: SotcatProps) {
    super(props);
    this.state = {
      imgData: undefined,
      drops: [],
      img: undefined,
      clipboardContent: "",
      selectedScanFname: "",
    }
    this.amDrawingCircle = false;
    this.circleCenter = undefined;
    this.imgScale = 0.7;
    this.canvasRef = React.createRef();

    console.log('Socat.constructor()')

  }

  componentDidMount() {
    // fetch('http://localhost:8000/pic')
    //   .then(res => res.json())
    //   .then(
    //     (result) => {
    //       console.log(result);
    //       // this.setState({
    //       //   imgData: result.imgData
    //       // })
    //       // let img = <img
    //       //   src={`data:image/png;base64,${imgData}`}
    //       //   width="800"
    //       // />;
    //       let img = new Image();
    //       // window.globals = {};
    //       // window.globals.img = img;
    //       // window.globals.ctx = this.ctx;
    //       img.src = `data:image/png;base64,${result.imgData}`;
    //       img.onload = () => {
    //         console.log("img.onload");

    //         this.setState({
    //           img: img,
    //         }, () => {
    //           this.canvasRef.current!.getContext("2d")!.drawImage(img, 0, 0, img.width * this.imgScale, img.height * this.imgScale);
    //         })

    //       }
    //     }
    //   )
  }

  render() {
    console.log("Sotcat.render()");
    return (
      <div style={{
        border: "1px solid black",
        backgroundColor: "rgba(252, 210, 207, 0.8)"
      }}>
        <ScanViewer
          onScanSelected={(fname: string) => {

            this.setState({
              selectedScanFname: fname,
              drops: [],
              clipboardContent: "",
            })

            let url = new URL('http://localhost:8000/select_scan')
            url.search = new URLSearchParams({
              fname: fname,
            }).toString();

            fetch(url.toString())
              .then(res => res.json())
              .then((result) => {
                console.log(result)

                let img = new Image();
                img.src = `data:image/png;base64,${result.imgData}`;
                img.onload = () => {
                  this.setState({
                    img: img,
                  }, () => {
                    this.canvasRef.current!.getContext("2d")!.drawImage(img, 0, 0, img.width * this.imgScale, img.height * this.imgScale);
                  })
                }
              })

          }}
        />
        <div
          style={{
            display: "flex",
            flexDirection: "row",
          }}
        >
          {this.state.img ? (
            <canvas
              id="canvas"
              width={(this.state.img && this.state.img!.width * this.imgScale) || "1600"}
              height={(this.state.img && this.state.img!.height * this.imgScale) || "1000"}
              // width = "1600"
              // height = "1000"
              style={{
                border: "1px solid red"
              }}
              ref={this.canvasRef}
              onMouseDown={(event: React.MouseEvent<HTMLCanvasElement, MouseEvent>) => {
                let canvas: HTMLCanvasElement = event.target as HTMLCanvasElement;

                if (this.amDrawingCircle) {
                  this.amDrawingCircle = false;
                  // return;


                  this.postCircle(
                    {
                      x: this.circleCenter!.x / this.imgScale,
                      y: this.circleCenter!.y / this.imgScale,
                    },
                    this.getRadius(this.circleCenter!, this.getMousePosOnCanvas(canvas, event)) / this.imgScale
                  );
                  return;
                }
                this.amDrawingCircle = true;
                let pointer = this.getMousePosOnCanvas(canvas, event);
                this.circleCenter = pointer;

                let ctx = canvas.getContext("2d")!;


                this.drawCircle(ctx, pointer, 4, 'black');
                this.drawCircle(ctx, pointer, 6, 'black');
                this.drawCircle(ctx, pointer, 5, 'white');
              }}
              onMouseMove={(event) => {
                let canvas: HTMLCanvasElement = event.target as HTMLCanvasElement;

                if (!this.amDrawingCircle) {
                  return;
                }

                let pointer = this.getMousePosOnCanvas(canvas, event);

                let radius = this.getRadius(this.circleCenter!, pointer);

                if (radius > 2) {
                  let ctx = canvas.getContext("2d")!;

                  ctx.clearRect(0, 0, canvas.width, canvas.height);
                  ctx.drawImage(this.state.img!, 0, 0, this.state.img!.width * this.imgScale, this.state.img!.height * this.imgScale);
                  this.drawSelection(ctx, this.circleCenter!, radius);
                }
              }}
            ></canvas>
          ) : ""}
                  <div style={{
          display: "flex",
        }}>
          <ClipboardView
            text={this.state.clipboardContent}
          />
        </div>
        </div>
        <div style={{
          display: "flex",
        }}>
          {this.state.drops}
        </div>
      </div>
    )
  }

  drawSelection(ctx: CanvasRenderingContext2D, centerXY: Point, radius: number) {
    this.drawCircle(ctx, centerXY, radius - 1, 'black');
    this.drawCircle(ctx, centerXY, radius + 1, 'black');
    this.drawCircle(ctx, centerXY, radius, 'white');
  }

  postCircle(center: { x: number, y: number }, radius: number) {
    fetch('http://localhost:8000/new_circle', {
      method: 'POST',
      body: JSON.stringify({
        center: center,
        radius: radius,
        fname: this.state.selectedScanFname,
      })
    }).then(res => res.json())
      .then((result) => {
        console.log(result)
        this.setState(prevState => ({
          drops: [...prevState.drops, <Drop
            contextPicB64={result.circContext}
            colourComparePicB64={result.colourCompare}
            key={this.state.drops.length}
          />],
          clipboardContent: result.clipboardContent,
        }))
      })
  }

  drawCircle(ctx: CanvasRenderingContext2D, locXY: Point, radius: number, colour: string) {
    ctx.beginPath();
    ctx.strokeStyle = colour;
    ctx.arc(locXY.x, locXY.y, radius, 0, 2 * Math.PI);
    ctx.closePath();
    ctx.stroke();
  }

  getMousePosOnCanvas(canvas: HTMLCanvasElement, event: React.MouseEvent<HTMLCanvasElement, MouseEvent>) {
    let rect = canvas.getBoundingClientRect();
    return {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top,
    }
  }

  getRadius(center: Point, pointer: Point) {
    return Math.sqrt(
      (pointer.x - center.x) ** 2 + (pointer.y - center.y) ** 2
    ) / 5;
  }
}

// ReactDOM.render(
//   <Socat />,
//   document.getElementById('root')
// );

type DropProps = {
  contextPicB64: string,
  colourComparePicB64: string,
};

type DropState = {

};

class Drop extends React.Component<DropProps, DropState> {

  constructor(props: DropProps) {
    super(props)
  }

  render() {
    return (
      <div style={{
        border: "1px solid blue",
        display: "flex",
        flexDirection: "column",
      }}>
        <div>
          <img
            src={`data:image/png;base64,${this.props.contextPicB64}`}
            width="150"
          />
        </div>
        <div>
          <img
            src={`data:image/png;base64,${this.props.colourComparePicB64}`}
            width="150"
          />
        </div>
      </div>
    )
  }
}

class ClipboardView extends React.Component<{ text: string }, {}> {

  render() {
    console.log(this.props.text.split("\n").map(row => {
      <tr>
        {row.split("\t").map(elt => {
          <td>
            {elt}
          </td>
        })}
      </tr>
    }));
    return (
      <table>
        <tbody>
          {this.props.text.split("\n").map(row =>
            <tr>
              {row.split("\t").map(elt =>
                <td style={{
                  border: "1px solid black"
                }}>
                  {elt}
                </td>
              ).concat([
                <td style = {{
                  backgroundColor: `rgb(${row.split("\t").join(",")})`,
                  width: 20,
                  border: "1px solid black"
                }}></td>
              ])}
            </tr>
          )}
        </tbody>
      </table>
    )
  }
}

type ScanViewerProps = {
  onScanSelected: (fname: string) => void;
}

type ScanViewerState = {
  thumbnails: Array<{
    fileName: string,
    img64: string,
  }>,
  selectedIdx: number,
}

class ScanViewer extends React.Component<ScanViewerProps, ScanViewerState> {

  selectedTNRef: React.RefObject<HTMLImageElement>;
  scansDivRef: React.RefObject<HTMLDivElement>;

  constructor(props: ScanViewerProps) {
    super(props)

    this.selectedTNRef = React.createRef();
    this.scansDivRef = React.createRef();

    this.state = {
      thumbnails: [],
      selectedIdx: -1,
    }
  }

  render() {
    return (
      <div style={{
        border: "1px solid black",
        display: "flex",
        flexDirection: "row",
        width: 1000,
      }}>
        <div>
          <button
            style={{
              height: 100,
              width: 50,
              fontSize: 12,
            }}
            onClick={() => {
              fetch('http://localhost:8000/open_folder')
                .then(res => res.json())
                .then(res => {
                  console.log(res)

                  if (!res.hasImages) {
                    alert("Selected Folder is Empty");
                    return;
                  }

                  res.thumbnails.map((tn: { fileName: string, img: string }) => {
                    this.setState(prevState => ({
                      thumbnails: [...prevState.thumbnails, {
                        fileName: tn.fileName,
                        img64: tn.img,
                      }]
                    }), () => {
                      this._on_selection(0);
                    })
                  });
                })
            }}
          >Open Folder</button>
        </div>
        <div>
          <button
            style={{
              height: 100,
              width: 50,
            }}
            onClick={() => {
              this._on_selection(this.state.selectedIdx - 1);
            }}
          >◀</button>
        </div>
        <div>
          <button
            style={{
              width: 50,
              height: 100,
            }}
            onClick={() => {
              this._on_selection(this.state.selectedIdx + 1);
            }}
          >▶</button>
        </div>
        <div
          style={{
            overflowX: "auto",
            whiteSpace: "nowrap",
          }}
          ref={this.scansDivRef}
        >
          {this.state.thumbnails.map((tn, i) => <img
            key={i}
            src={`data:image/png;base64,${tn.img64}`}
            width="150"
            style={i == this.state.selectedIdx ? {
              border: "5px solid green",
            } : {}}
            ref={i == this.state.selectedIdx ? this.selectedTNRef : undefined}
          />)}
        </div>
      </div>
    )
  }

  _on_selection(selectedIdx: number) {
    if (selectedIdx == this.state.selectedIdx || selectedIdx < 0 || selectedIdx >= this.state.thumbnails.length) {
      return;
    }
    this.props.onScanSelected(this.state.thumbnails[selectedIdx].fileName);
    this.setState({
      selectedIdx: selectedIdx
    }, () => {
      let selectedPos = this.selectedTNRef.current!.offsetLeft;
      console.log(selectedPos);
      this.scansDivRef.current!.scrollLeft = selectedPos - 400;
    })
  }
}

export default Sotcat;