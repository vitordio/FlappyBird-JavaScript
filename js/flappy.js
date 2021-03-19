function novoElemento(tagName, className) {
    const elem = document.createElement(tagName)
    elem.className = className

    return elem
}

// Função construtora - vamos instanciar essa função para criação de uma barreira
// reversa define se será a barreira de cima ou de baixo
function Barreira(reversa = false) {
    this.elemento = novoElemento('div', 'barreira')

    const borda = novoElemento('div', 'borda')
    const corpo = novoElemento('div', 'corpo')

    this.elemento.appendChild(reversa ? corpo : borda)
    this.elemento.appendChild(reversa ? borda : corpo)

    // método para alterar a altura da Barreira
    this.setAltura = altura => corpo.style.height = `${altura}px`
}

// const b = new Barreira(true)
// b.setAltura(300)
// document.querySelector('[wm-flappy]').appendChild(b.elemento)

function ParDeBarreiras(altura, abertura, x) {
    this.elemento = novoElemento('div', 'par-de-barreiras')

    this.superior = new Barreira(true)
    this.inferior = new Barreira(false)

    // adicionamos dentro da div 'par-de-barreira' os elementos superiores e inferiores
    this.elemento.appendChild(this.superior.elemento)
    this.elemento.appendChild(this.inferior.elemento)

    // sorteamos como as aberturas vão aparecer
    this.sortearAbertura = () => {
        const alturaSuperior = Math.random() * (altura - abertura)
        const alturaInferior = altura - abertura - alturaSuperior
        
        this.superior.setAltura(alturaSuperior)
        this.inferior.setAltura(alturaInferior)
    }

    this.getX = () => parseInt(this.elemento.style.left.split('px')[0]) // para sabermos em que posição o par de barreiras está
    this.setX = x => this.elemento.style.left = `${x}px` // altremos o x a partir do x que foi passado
    this.getLargura = () => this.elemento.clientWidth // pegamos a largura do elemento

    this.sortearAbertura()
    this.setX(x)
}

// const b = new ParDeBarreiras(700, 200, 400)
// document.querySelector('[wm-flappy]').appendChild(b.elemento)

// Função construtora que recebe:
// altura e largura do jogo
// abertura entre as barreiras
// espaço entre as barreiras
// notificarPonto - função que informará quando uma barreira passar pelo meio do jogo
function Barreiras(altura, largura, abertura, espaco, notificarPonto) {
    this.pares = [
        new ParDeBarreiras(altura, abertura, largura),
        new ParDeBarreiras(altura, abertura, largura + espaco),
        new ParDeBarreiras(altura, abertura, largura + espaco * 2),
        new ParDeBarreiras(altura, abertura, largura + espaco * 3),
    ]

    // de quantos em quantos px será deslocado as barreiras
    const deslocamento = 3
    this.animar = () => {
        this.pares.forEach(par => {
            par.setX(par.getX() - deslocamento)

            // quando o elemento sair da área do jogo
            // setamos para o elemento ir para o final
            if(par.getX() < -par.getLargura()) {
                par.setX(par.getX() + espaco * this.pares.length)

                // sorteamos novamente as alturas as barreiras para que
                // quando ela apareça novamente apareça com outras dimensões
                par.sortearAbertura()
            }

            const meio = largura / 2
            const cruzouOMeio = par.getX() + deslocamento >= meio && par.getX() < meio
    
            // Se cruzou o meio, notifica o ponto
            // cruzouOMeio && notificarPonto()
            if(cruzouOMeio) notificarPonto()
        })
    }
}

function Passaro(alturaJogo) {
    let voando = false

    this.elemento = novoElemento('img', 'passaro')
    this.elemento.src = 'imgs/passaro.png'

    this.getY = () => parseInt(this.elemento.style.bottom.split('px')[0])
    this.setY = y => this.elemento.style.bottom = `${y}px`

    // Quando o usuário pressionar qualquer tecla, setamos o voando para true
    window.onkeydown = e => voando = true
    window.onkeyup = e => voando = false
    
    this.animar = () => {
        const novoY = this.getY() + (voando ? 8 : -5)
        const alturaMaxima = alturaJogo - this.elemento.clientHeight
        
        if(novoY <= 0) {
            this.setY(0)
        } else if(novoY >= alturaMaxima) {
            this.setY(alturaMaxima)
        } else {
            this.setY(novoY)
        }
    }

    this.setY(alturaJogo / 2)
}

function Progresso() {
    this.elemento = novoElemento('span', 'progresso')
    
    this.atualizarPontos = pontos => {
        this.elemento.innerHTML = pontos
    }
    
    this.atualizarPontos(0)
}

// Função para verificação de colisão dos elementos
function estaoSobrepostos(elementoA, elementoB) {
    const a = elementoA.getBoundingClientRect() // retângulo associado ao elemento A
    const b = elementoB.getBoundingClientRect() // retângulo associado ao elemento B

    // Verificação de colisões - horizontais e verticais
    // Lado esquerdo do elemento A + Largura do elemento A = lado direito do elemento A >= lado esquerdo do elemento B ?
    // Lado esquerdo do elemento B + Largura do elemento B = lado direito do elemento B >= lado esquerdo do elemento A ?
    const horizontal = a.left + a.width >= b.left
        && b.left + b.width >= a.left

    const vertical = a.top + a.height >= b.top
        && b.top + b.height >= a.top

    return horizontal && vertical
}

function colidiu(passaro, barreiras) {
    let colidiu = false
    barreiras.pares.forEach(parDeBarreiras => {
        if(!colidiu) {
            const superior = parDeBarreiras.superior.elemento
            const inferior = parDeBarreiras.inferior.elemento

            // Verifica se o pássaro está sobreposto em relação as
            // barreiras inferiores e superiores
            colidiu = estaoSobrepostos(passaro.elemento, superior) || estaoSobrepostos(passaro.elemento, inferior)
        }
    })

    return colidiu
}

function reiniciarJogo() {
    this.elemento = novoElemento('div', 'colidiu')
    const message1 = novoElemento('h3', 'message')
    const message2 = novoElemento('h5', 'message')

    message1.innerHTML = 'Você colidiu :(';
    message2.innerHTML = 'Reinicie a página para tentar novamente!';

    this.elemento.appendChild(message1)
    this.elemento.appendChild(message2)
}

// Função que irá representar o jogo de fato
function FlappyBird() {
    let pontos = 0

    const areaDoJogo = document.querySelector('[wm-flappy]')
    const alturaJogo = areaDoJogo.clientHeight
    const larguraJogo = areaDoJogo.clientWidth

    const progresso = new Progresso()
    const barreiras = new Barreiras(alturaJogo, larguraJogo, 200, 400, () => progresso.atualizarPontos(++pontos))
    const passaro = new Passaro(alturaJogo)

    areaDoJogo.appendChild(progresso.elemento)
    areaDoJogo.appendChild(passaro.elemento)
    barreiras.pares.forEach(par => areaDoJogo.appendChild(par.elemento))

    this.start = () => {
        // loop do jogo
        const temporizador = setInterval(() => {
            barreiras.animar()
            passaro.animar()

            if(colidiu(passaro, barreiras)) {
                areaDoJogo.appendChild(new reiniciarJogo().elemento)
                clearInterval(temporizador)
            } 

        }, 20)
    }
    
}

// Iniciar o jogo
new FlappyBird().start()

// const barreiras = new Barreiras(700, 1200, 200, 400)
// const passaro = new Passaro(700)
// const areaDoJogo = document.querySelector('[wm-flappy]')

// areaDoJogo.appendChild(passaro.elemento)
// areaDoJogo.appendChild(new Progresso().elemento)
// barreiras.pares.forEach(par => areaDoJogo.appendChild(par.elemento))
// setInterval(() => {
//     passaro.animar()
//     barreiras.animar()
// }, 20)
