//Desarrollo de las visualizaciones
import * as d3 from 'd3';
import { numberWithCommas3 } from '../helpers';
import { setChartHeight } from '../modules/height';
import { setChartCanvas, setChartCanvasImage } from '../modules/canvas-image';
import { setRRSSLinks } from '../modules/rrss';
import { setFixedIframeUrl } from './chart_helpers';

//Colores fijos
const COLOR_PRIMARY_1 = '#F8B05C',
COLOR_COMP_1 = '#528FAD', 
COLOR_COMP_2 = '#AADCE0',
COLOR_GREY_1 = '#D6D6D6',
COLOR_ANAG_PRIM_1 = '#BA9D5F', 
COLOR_ANAG_PRIM_2 = '#9E6C51',
COLOR_ANAG_COMP_1 = '#1C5A5E';

export function initChart() {
    //Desarrollo del gráfico
    d3.csv('https://raw.githubusercontent.com/EnvejecimientoEnRed/informe_perfil_mayores_2022_social_4_5/main/data/cuidadores_personas_mas65_espana.csv', function(error,data) {
        if (error) throw error;

        let pathsMen, pathsWomen;

        //Círculo para cuidadores de hombres
        let width = 302,
            height = 302,
            margin = 22;

        let radius = Math.min(width, height) / 2 - margin;

        // append the svg object to the div called 'my_dataviz'
        let chart1 = d3.select("#circle--first")
            .append("svg")
                .attr("width", width)
                .attr("height", height)
            .append("g")
                .attr("transform", "translate(" + width / 2 + "," + height / 2 + ")");

        let color = d3.scaleOrdinal()
            .domain(data.map(function(item) { return item.tipo_cuidador; }).keys())
            .range([COLOR_PRIMARY_1, COLOR_ANAG_PRIM_1, COLOR_COMP_2, COLOR_COMP_1, COLOR_ANAG_COMP_1, COLOR_ANAG_PRIM_2, COLOR_GREY_1]); 

        let pieHombres = d3.pie()
            .sort(null)
            .value(function(d) {return d.value.hombre_65_dependiente; });

        let data_hombres = pieHombres(d3.entries(data));

        data_hombres = data_hombres.filter(function(item) {
            if (!isNaN(item.value)) {
                return item;
            }
        });

        let arc = d3.arc()
            .innerRadius(radius * 0.4)
            .outerRadius(radius * 0.8);
        
        let outerArc = d3.arc()
            .innerRadius(radius * 0.9)
            .outerRadius(radius * 0.9);

        //Círculo para cuidadores de mujeres
        let chart2 = d3.select("#circle--second")
            .append("svg")
                .attr("width", width)
                .attr("height", height)
            .append("g")
                .attr("transform", "translate(" + width / 2 + "," + height / 2 + ")");

        let pieMujeres = d3.pie()
            .sort(null)
            .value(function(d) { return d.value.mujer_65_dependiente; });
        
        let data_mujeres = pieMujeres(d3.entries(data));

        data_mujeres = data_mujeres.filter(function(item) {
            if (!isNaN(item.value)) {
                return item;
            }
        });

        function init() {
            /////// Hombres
            //Barras
            chart1.selectAll('menSlices')
                .data(data_hombres)
                .enter()
                .append('path')
                .attr('class','menSlice')
                .attr('fill', function(d){ return(color(d.data.value.tipo_cuidador)); })
                .attr("stroke", "white")
                .style("stroke-width", "0.25px")
                .style("opacity", 1)
                .transition()
                .delay(function(d, i) { return i * 400; })
                .duration(400)
                .attrTween('d', function(d) {
                    let i = d3.interpolate(d.startAngle, d.endAngle);
                    return function(t) {
                        d.endAngle = i(t);
                        return arc(d);
                    }
                });

            //Líneas
            chart1.selectAll('menPolylines')
                .data(data_hombres)
                .enter()
                .append('polyline')
                .attr('class','rectMen')
                .attr("stroke", "black")
                .style("fill", "none")
                .attr("stroke-width", 1)
                .attr('points', function(d) {
                    if(d.value != 0) {
                        let posA = arc.centroid(d) // line insertion in the slice
                        let posB = outerArc.centroid(d) // line break: we use the other arc generator that has been built only for that
                        let posC = outerArc.centroid(d); // Label position = almost the same as posB
                        let midangle = d.startAngle + (d.endAngle - d.startAngle) / 2 // we need the angle to see if the X position will be at the extreme right or extreme left
                        posC[0] = radius * 0.8 * (midangle < Math.PI ? 1 : -1); // multiply by 1 or -1 to put it on the right or on the left
                        return [posA, posB, posC]
                    }                    
                });

            pathsMen = chart1.selectAll('.rectMen');

            pathsMen.attr("stroke-dasharray", 968 + " " + 968)
                .attr("stroke-dashoffset", 968)
                .transition()
                .ease(d3.easeLinear)
                .attr("stroke-dashoffset", 0)
                .delay(2100)
                .duration(2000);
            
            //Texto
            chart1.selectAll('menLabels')
                .data(data_hombres)
                .enter()
                .append('text')
                .attr('class', 'chart_text')
                .text( function(d) {
                    if(d.value != 0) {
                        return numberWithCommas3(parseFloat(d.data.value.hombre_65_dependiente).toFixed(1)) + '%'; 
                    }                    
                })
                .attr('transform', function(d) {
                    if(d.value != 0) {
                        let pos = outerArc.centroid(d);
                        let midangle = d.startAngle + (d.endAngle - d.startAngle) / 2
                        pos[0] = radius * 0.85 * (midangle < Math.PI ? 1 : -1);
                        return 'translate(' + pos + ')';
                    }                    
                })
                .style('text-anchor', function(d) {
                    if(d.value != 0) {
                        let midangle = d.startAngle + (d.endAngle - d.startAngle) / 2
                        return (midangle < Math.PI ? 'start' : 'end');
                    }                    
                })
                .style('opacity', 0)
                .transition()
                .delay(2100)
                .duration(2000)
                .style('opacity',1);
            
            /////// Mujeres
            // Barras
            chart2.selectAll('womenSlices')
                .data(data_mujeres)
                .enter()
                .append('path')
                .attr('class','womenSlice')
                .attr('fill', function(d){ return(color(d.data.value.tipo_cuidador)); })
                .attr("stroke", "white")
                .style("stroke-width", "0.25px")
                .style("opacity", 1)
                .transition()
                .delay(function(d, i) { return i * 400; })
                .duration(400)
                .attrTween('d', function(d) {
                    let i = d3.interpolate(d.startAngle, d.endAngle);
                    return function(t) {
                        d.endAngle = i(t);
                        return arc(d);
                    }
                });
            
            //Líneas
            chart2.selectAll('womenPolylines')
                .data(data_mujeres)
                .enter()
                .append('polyline')
                .attr('class','rectWomen')
                .attr("stroke", "black")
                .style("fill", "none")
                .attr("stroke-width", 1)
                .attr('points', function(d) {
                    if(d.value != 0) {
                        console.log(d);
                        let posA = arc.centroid(d) // line insertion in the slice
                        let posB = outerArc.centroid(d) // line break: we use the other arc generator that has been built only for that
                        let posC = outerArc.centroid(d); // Label position = almost the same as posB
                        let midangle = d.startAngle + (d.endAngle - d.startAngle) / 2 // we need the angle to see if the X position will be at the extreme right or extreme left
                        posC[0] = radius * 0.8 * (midangle < Math.PI ? 1 : -1); // multiply by 1 or -1 to put it on the right or on the left
                        if(d.index == 6) {
                            return [posA, posB];
                        } else {
                            return [posA, posB, posC];
                        }
                        
                    }                    
                });
            
            pathsWomen = chart2.selectAll('.rectWomen');

            pathsWomen.attr("stroke-dasharray", 968 + " " + 968)
                .attr("stroke-dashoffset", 968)
                .transition()
                .ease(d3.easeLinear)
                .attr("stroke-dashoffset", 0)
                .delay(2100)
                .duration(2000);
            
            //Texto
            chart2.selectAll('womenLabels')
                .data(data_mujeres)
                .enter()
                .append('text')
                .attr('class', 'chart_text')
                .text( function(d) {
                    if(d.value != 0) {
                        return numberWithCommas3(parseFloat(d.data.value.mujer_65_dependiente).toFixed(1)) + '%'; 
                    }                    
                })
                .attr('transform', function(d) {
                    if(d.value != 0) {
                        let pos = outerArc.centroid(d);
                        let midangle = d.startAngle + (d.endAngle - d.startAngle) / 2
                        pos[0] = radius * 0.85 * (midangle < Math.PI ? 1 : -1);
                        if(d.index == 6) {
                            pos[0] = 20;
                        } 

                        return 'translate(' + pos + ')';
                    }                    
                })
                .style('text-anchor', function(d) {
                    if(d.value != 0) {
                        let midangle = d.startAngle + (d.endAngle - d.startAngle) / 2
                        return (midangle < Math.PI ? 'start' : 'end');
                    }                    
                })
                .style('opacity', 0)
                .transition()
                .delay(2100)
                .duration(2000)
                .style('opacity',1);
        }

        function animateChart() {
            //Barras
            chart1.selectAll('.menSlice')
                .attr('d', 0)
                .transition()
                .delay(function(d, i) { return i * 400; })
                .duration(400)
                .attrTween('d', function(d) {
                    let i = d3.interpolate(d.startAngle, d.endAngle);
                    return function(t) {
                        d.endAngle = i(t);
                        return arc(d);
                    }
                });

            chart2.selectAll('.womenSlice')
                .attr('d', 0)
                .transition()
                .delay(function(d, i) { return i * 400; })
                .duration(400)
                .attrTween('d', function(d) {
                    let i = d3.interpolate(d.startAngle, d.endAngle);
                    return function(t) {
                        d.endAngle = i(t);
                        return arc(d);
                    }
                });

            //Líneas
            pathsMen.attr("stroke-dasharray", 968 + " " + 968)
                .attr("stroke-dashoffset", 968)
                .transition()
                .ease(d3.easeLinear)
                .attr("stroke-dashoffset", 0)
                .delay(2100)
                .duration(2000);

            pathsWomen.attr("stroke-dasharray", 968 + " " + 968)
                .attr("stroke-dashoffset", 968)
                .transition()
                .ease(d3.easeLinear)
                .attr("stroke-dashoffset", 0)
                .delay(2100)
                .duration(2000);

            //Texto
            chart1.selectAll('.chart_text')
                .style('opacity', 0)
                .transition()
                .delay(2100)
                .duration(2000)
                .style('opacity',1);

            chart2.selectAll('.chart_text')
                .style('opacity', 0)
                .transition()
                .delay(2100)
                .duration(2000)
                .style('opacity',1);
        }

        /////
        /////
        // Resto - Chart
        /////
        /////
        init();

        //Animación del gráfico
        document.getElementById('replay').addEventListener('click', function() {
            animateChart();

            setTimeout(() => {
                setChartCanvas();
            }, 4000);
        });

        /////
        /////
        // Resto
        /////
        /////

        //Iframe
        setFixedIframeUrl('informe_perfil_mayores_2022_social_4_5','distribucion_cuidadores_principales');

        //Redes sociales > Antes tenemos que indicar cuál sería el texto a enviar
        setRRSSLinks('distribucion_cuidadores_principales');

        //Captura de pantalla de la visualización
        setTimeout(() => {
            setChartCanvas();
        }, 4000);

        let pngDownload = document.getElementById('pngImage');

        pngDownload.addEventListener('click', function(){
            setChartCanvasImage('distribucion_cuidadores_principales');
        });

        //Altura del frame
        setChartHeight();
    });    
}