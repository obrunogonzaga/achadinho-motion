import AppKit
import CoreImage
import Vision

let args = CommandLine.arguments
guard args.count == 3 else {
    print("uso: recorte <entrada> <saida.png>")
    exit(1)
}

let input = URL(fileURLWithPath: args[1])
let output = URL(fileURLWithPath: args[2])
guard let ciImage = CIImage(contentsOf: input) else {
    print("não abriu a imagem")
    exit(1)
}

let handler = VNImageRequestHandler(ciImage: ciImage)
let request = VNGenerateForegroundInstanceMaskRequest()
try handler.perform([request])
guard let result = request.results?.first else {
    print("nenhum objeto encontrado")
    exit(1)
}

let buffer = try result.generateMaskedImage(ofInstances: result.allInstances, from: handler, croppedToInstancesExtent: true)
let masked = CIImage(cvPixelBuffer: buffer)
let context = CIContext()
guard let colorSpace = CGColorSpace(name: CGColorSpace.sRGB) else { exit(1) }
try context.writePNGRepresentation(of: masked, to: output, format: .RGBA8, colorSpace: colorSpace)
print("ok \(output.lastPathComponent)")
